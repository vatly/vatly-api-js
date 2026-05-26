/**
 * Webhook signature verification — Vatly-Signature `t=<unix>,v1=<hex>` scheme.
 *
 * Wire format (canonical source: vatlify ADR-018, src/Service/Http/DefaultSigner.php):
 *
 *   Header:   Vatly-Signature: t=<unix_seconds>,v1=<hex_hmac_sha256>[,vN=...]
 *   HMAC:     hash_hmac('sha256', "{t}.{rawBody}", $secret)
 *   Body:     the exact byte string sent on the wire (single json_encode pass)
 *   Event id: Vatly-Event-Id: <eventId> — stable across retries, use for dedup
 *
 * Receivers MUST verify against the raw body bytes. Reserialised JSON changes
 * the bytes (whitespace, key order, number formatting) and breaks the HMAC.
 *
 * Freshness: `t` is bound into the HMAC AND checked against the local clock
 * (`|now - t| <= toleranceSeconds`, default 5 minutes — matches Stripe's
 * `tolerance` default). This is a stateless clock-skew tolerance check, not
 * full replay defense — see "Dedup is the caller's job" below.
 *
 * Dedup is the caller's job. The SDK has no persistence; it cannot remember
 * which events it has already verified. To get full replay defense, key your
 * own store on `Vatly-Event-Id` (also surfaced in the payload as `event.id`,
 * stable across retries) and skip events you've already processed.
 *
 * Forward compat: the header carries `v1=` today; future algorithm rotation
 * will ship `v1=...,v2=...` simultaneously. We verify any version we recognize
 * (first match wins) and ignore unknown slots.
 *
 * Uses Web Crypto so the same code runs on Node 18+, Workers, Vercel Edge,
 * Deno, and Bun. `node:crypto` is deliberately NOT used.
 */

import { VatlyInvalidSignatureError } from "../errors.js";
import type { WebhookEvent } from "../types.js";

export type RawBody = string | ArrayBuffer | ArrayBufferView | Uint8Array;

/** HTTP header carrying the signature on incoming webhook deliveries. */
export const VATLY_SIGNATURE_HEADER = "Vatly-Signature";

/**
 * HTTP header carrying the per-event id. Stable across retry attempts; use
 * for receiver-side dedup independent of signature freshness.
 */
export const VATLY_EVENT_ID_HEADER = "Vatly-Event-Id";

/** Signature versions this SDK can verify, in priority order. */
const RECOGNIZED_VERSIONS = ["v1"] as const;
type RecognizedVersion = (typeof RECOGNIZED_VERSIONS)[number];

/** Default clock-skew tolerance, matches Stripe SDK's `tolerance` default. */
const DEFAULT_TOLERANCE_SECONDS = 300;

export interface VerifyOptions {
  /**
   * Maximum clock skew tolerated between the signer (Vatly) and the verifier
   * (your server). Reject signatures where `|now - t| > toleranceSeconds`.
   * Default 300 (5 min). Set to `0` to disable the freshness check entirely
   * (NOT recommended in production).
   *
   * This is a stateless freshness check — it bounds how long a leaked
   * signature is replayable, but does NOT prevent replays within the window.
   * For full replay defense, dedupe on `Vatly-Event-Id` in your own store.
   */
  toleranceSeconds?: number;
  /**
   * Override the current time used for the freshness check (in unix seconds).
   * Useful for tests and for callers with a synced clock source.
   * Defaults to `Math.floor(Date.now() / 1000)`.
   */
  now?: () => number;
}

/**
 * Throws `VatlyInvalidSignatureError` if the signature is missing, malformed,
 * stale, or doesn't match. Returns normally on success.
 *
 * `secret` may be a single string or an array — useful during secret rotation.
 * The signature is accepted if it verifies against ANY of the provided secrets.
 */
export async function verifyWebhookSignature(
  rawBody: RawBody,
  signatureHeader: string | null | undefined,
  secret: string | readonly string[],
  options?: VerifyOptions,
): Promise<void> {
  if (typeof signatureHeader !== "string" || signatureHeader.length === 0) {
    throw new VatlyInvalidSignatureError("Missing webhook signature.");
  }
  const secrets = normalizeSecrets(secret);

  const parsed = parseSignatureHeader(signatureHeader);

  if (parsed.t === undefined) {
    throw new VatlyInvalidSignatureError("Signature header missing or invalid `t` field.");
  }

  const candidate = pickRecognizedVersion(parsed.versions);
  if (!candidate) {
    throw new VatlyInvalidSignatureError(
      `Signature header has no recognized version (looked for ${RECOGNIZED_VERSIONS.join(", ")}).`,
    );
  }

  // Freshness check — `t` is bound into the HMAC, so a stale `t` also produces
  // a mismatched signature. We still check explicitly so the failure mode is
  // clear in errors and logs. NB: stateless; does NOT prevent replays inside
  // the tolerance window (dedupe on Vatly-Event-Id for that).
  const tolerance = options?.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (tolerance > 0) {
    const now = options?.now ? options.now() : Math.floor(Date.now() / 1000);
    if (Math.abs(now - parsed.t) > tolerance) {
      throw new VatlyInvalidSignatureError(
        `Signature timestamp ${parsed.t} is outside the ${tolerance}s tolerance (now=${now}).`,
      );
    }
  }

  const signingInput = buildSigningInput(parsed.t, rawBody);

  // Try each secret. Match if any one verifies. Iterate fully so the timing
  // of accepts/rejects doesn't leak which secret matched.
  let matched = false;
  for (const s of secrets) {
    const expected = await computeHmacHex(signingInput, s);
    if (constantTimeEqualHex(candidate.value, expected)) {
      matched = true;
      // Don't break — keep iterating so we don't leak position via timing.
    }
  }
  if (!matched) {
    throw new VatlyInvalidSignatureError(`Webhook signature mismatch on ${candidate.version}.`);
  }
}

function normalizeSecrets(secret: string | readonly string[]): readonly string[] {
  const list = typeof secret === "string" ? [secret] : secret;
  if (!Array.isArray(list) || list.length === 0) {
    throw new VatlyInvalidSignatureError(
      "Webhook secret must be a non-empty string or non-empty array of strings.",
    );
  }
  for (const s of list) {
    if (typeof s !== "string" || s.length === 0) {
      throw new VatlyInvalidSignatureError("Webhook secret entries must all be non-empty strings.");
    }
  }
  return list;
}

/** Non-throwing variant. Returns `true` iff the signature is valid. */
export async function isValidWebhookSignature(
  rawBody: RawBody,
  signatureHeader: string | null | undefined,
  secret: string | readonly string[],
  options?: VerifyOptions,
): Promise<boolean> {
  try {
    await verifyWebhookSignature(rawBody, signatureHeader, secret, options);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify and JSON-parse to a typed WebhookEvent.
 *
 * IMPORTANT: pass the RAW request body (string or bytes). Reserialising the
 * JSON gives different bytes and breaks the HMAC.
 */
export async function constructEvent(
  rawBody: RawBody,
  signatureHeader: string | null | undefined,
  secret: string | readonly string[],
  options?: VerifyOptions,
): Promise<WebhookEvent> {
  await verifyWebhookSignature(rawBody, signatureHeader, secret, options);
  const text =
    typeof rawBody === "string" ? rawBody : new TextDecoder().decode(toUint8Array(rawBody));
  try {
    return JSON.parse(text) as WebhookEvent;
  } catch {
    throw new VatlyInvalidSignatureError("Webhook body is not valid JSON.");
  }
}

/**
 * Convenience: read the raw body and `Vatly-Signature` header from a Fetch
 * `Request`, verify, and return the typed event.
 *
 * Body is consumed via `request.text()`; clone the request first if you need
 * to read it again downstream.
 */
export async function constructEventFromRequest(
  request: Request,
  secret: string | readonly string[],
  options?: VerifyOptions,
): Promise<WebhookEvent> {
  const rawBody = await request.text();
  const signature = request.headers.get(VATLY_SIGNATURE_HEADER);
  return constructEvent(rawBody, signature, secret, options);
}

// --- Lower-level helpers (exported for advanced use cases) -----------------

export interface ParsedSignatureHeader {
  /** Unix seconds, parsed from `t=`. `undefined` if missing/malformed. */
  t: number | undefined;
  /** All `vN=` slots seen, keyed by version label. */
  versions: Record<string, string>;
  /** All key/value pairs as-parsed, for debugging. */
  raw: Record<string, string>;
}

/** Parse a `Vatly-Signature` header value. Lenient on whitespace; order-agnostic. */
export function parseSignatureHeader(header: string): ParsedSignatureHeader {
  const raw: Record<string, string> = {};
  for (const piece of header.split(",")) {
    const trimmed = piece.trim();
    if (trimmed.length === 0) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim();
    if (k.length > 0) raw[k] = v;
  }

  const versions: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (/^v\d+$/.test(k) && v.length > 0) versions[k] = v;
  }

  let t: number | undefined;
  const tRaw = raw.t;
  if (typeof tRaw === "string" && /^\d{1,15}$/.test(tRaw)) {
    const n = Number(tRaw);
    if (Number.isFinite(n) && n >= 0) t = n;
  }

  return { t, versions, raw };
}

/**
 * Compute the canonical HMAC for a given timestamp / raw body / secret.
 * Mirrors `vatlify`'s `DefaultSigner::calculateSignature` byte-for-byte;
 * primarily exposed for testing against the locked protocol vector.
 *
 * Returns the lowercase hex `v1` value (without the `v1=` prefix).
 */
export async function computeSignatureV1(
  rawBody: RawBody,
  secret: string,
  timestamp: number,
): Promise<string> {
  if (!Number.isFinite(timestamp) || timestamp < 0 || !Number.isInteger(timestamp)) {
    throw new TypeError(`timestamp must be a non-negative integer, got ${timestamp}`);
  }
  return computeHmacHex(buildSigningInput(timestamp, rawBody), secret);
}

// --- internals -------------------------------------------------------------

function pickRecognizedVersion(
  versions: Record<string, string>,
): { version: RecognizedVersion; value: string } | undefined {
  for (const v of RECOGNIZED_VERSIONS) {
    const value = versions[v];
    if (typeof value === "string" && value.length > 0) {
      return { version: v, value };
    }
  }
  return undefined;
}

function buildSigningInput(timestamp: number, rawBody: RawBody): Uint8Array {
  const prefix = new TextEncoder().encode(`${timestamp}.`);
  const body = toUint8Array(rawBody);
  const out = new Uint8Array(prefix.length + body.length);
  out.set(prefix, 0);
  out.set(body, prefix.length);
  return out;
}

async function computeHmacHex(input: Uint8Array, secret: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error(
      "Vatly: globalThis.crypto.subtle is unavailable. " +
        "Use Node 18+ or a runtime that exposes Web Crypto.",
    );
  }

  const keyData = copyToArrayBuffer(new TextEncoder().encode(secret));
  const bodyData = copyToArrayBuffer(input);
  const key = await subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sigBuffer = await subtle.sign("HMAC", key, bodyData);
  return bufferToHex(new Uint8Array(sigBuffer));
}

function toUint8Array(input: RawBody): Uint8Array {
  if (typeof input === "string") return new TextEncoder().encode(input);
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  throw new TypeError("rawBody must be a string, ArrayBuffer, or ArrayBufferView.");
}

function copyToArrayBuffer(view: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(view.byteLength);
  new Uint8Array(buf).set(view);
  return buf;
}

function bufferToHex(buf: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < buf.length; i++) {
    hex += (buf[i]! >>> 4).toString(16);
    hex += (buf[i]! & 0xf).toString(16);
  }
  return hex;
}

/**
 * Constant-time equality check over two hex strings, case-insensitive.
 * Returns false on length mismatch (length is not secret).
 */
function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  let diff = 0;
  for (let i = 0; i < aLower.length; i++) {
    diff |= aLower.charCodeAt(i) ^ bLower.charCodeAt(i);
  }
  return diff === 0;
}
