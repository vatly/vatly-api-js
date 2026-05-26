/** Logical Vatly server target. */
export type VatlyServer = "production" | "staging";

export const VATLY_PRODUCTION_BASE_URL = "https://api.vatly.com/v1";
export const VATLY_STAGING_BASE_URL = "https://api.staging.vatly.com/v1";

/**
 * Same regex enforced by `vatly/vatly-api-php` (`VatlyApiClient::setApiKey`).
 * 5-char prefix (`live_` / `test_`) plus at least 18 chars of `\w` or `|`.
 */
const API_KEY_REGEX = /^(live|test)_[\w|]{18,}$/;

/**
 * Function that produces an Idempotency-Key value. Called once per mutating
 * request that doesn't already have a caller-supplied key. The default uses
 * `crypto.randomUUID()`, available on Node 18+, Workers, Vercel Edge, Deno,
 * and Bun.
 */
export type IdempotencyKeyGenerator = () => string;

/**
 * Extra fragments merged into the `X-Vatly-Client-Info` header.
 * Pass `false` on the client option to omit the header entirely.
 * Values are joined as `key=value; key=value` after the auto-detected
 * runtime/os/arch defaults.
 */
export type ClientInfoFragments = Record<string, string | undefined>;

export interface VatlyClientOptions {
  /**
   * Vatly API key. Must match `^(live|test)_[\w|]{18,}$`.
   * Falls back to the `VATLY_API_KEY` env var on Node.
   */
  apiKey?: string;
  /** Override the base URL. Takes precedence over `server`. */
  baseUrl?: string;
  /** Select a named server. Defaults to `"production"`. */
  server?: VatlyServer;
  /** Per-request timeout in ms. Defaults to 30s. Set to 0 to disable. */
  timeoutMs?: number;
  /** Max retry attempts on 429/5xx/network errors. Defaults to 2. */
  maxRetries?: number;
  /** Inject a custom `fetch` implementation. Useful for tests. */
  fetch?: typeof fetch;
  /** Optional extra headers to send with every request. */
  defaultHeaders?: Record<string, string>;
  /**
   * SDK identifier appended to the `User-Agent` header.
   * Defaults to `vatly-sdk-js/<version>`.
   */
  userAgent?: string;
  /**
   * Generator for automatic `Idempotency-Key` headers on POST and PATCH.
   * - Default: a UUID v4 from `crypto.randomUUID()`.
   * - Pass a function to customize (e.g. inject a request-id from a tracer).
   * - Pass `false` to disable auto-generation; callers must then opt in
   *   per-call via `opts.idempotencyKey`. POST/PATCH without a key will not
   *   be retried by the SDK.
   */
  idempotencyKeyGenerator?: IdempotencyKeyGenerator | false;
  /**
   * Extra fragments to merge into the `X-Vatly-Client-Info` header,
   * on top of the auto-detected `runtime` / `os` / `arch` defaults.
   *
   *   new VatlyClient({ clientInfo: { app: "MyApp/1.2.3", framework: "Next.js/14" } });
   *   // X-Vatly-Client-Info: runtime=node/v25.9.0; os=darwin; arch=arm64; app=MyApp/1.2.3; framework=Next.js/14
   *
   * Pass `false` to omit the header entirely.
   */
  clientInfo?: ClientInfoFragments | false;
}

export interface ResolvedConfig {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  fetch: typeof fetch;
  defaultHeaders: Record<string, string>;
  userAgent: string;
  mode: "live" | "test";
  /** Pre-rendered header value, or `undefined` if disabled. */
  clientInfoHeader: string | undefined;
  /** May be `undefined` only if explicitly disabled via `idempotencyKeyGenerator: false`. */
  idempotencyKeyGenerator: IdempotencyKeyGenerator | undefined;
}

export const SDK_VERSION = "0.2.0";

function readEnvApiKey(): string | undefined {
  // `process` is undefined on some edge runtimes (Cloudflare Workers w/o nodejs_compat).
  // Guard via typeof to remain portable.
  if (typeof process !== "undefined" && process?.env) {
    return process.env.VATLY_API_KEY;
  }
  return undefined;
}

export function resolveConfig(options: VatlyClientOptions = {}): ResolvedConfig {
  const apiKey = options.apiKey ?? readEnvApiKey();
  if (!apiKey || apiKey.length === 0) {
    throw new Error(
      "Vatly: missing API key. Pass `apiKey` to VatlyClient or set the VATLY_API_KEY env var.",
    );
  }

  const mode = detectMode(apiKey);

  const baseUrl =
    options.baseUrl ??
    (options.server === "staging" ? VATLY_STAGING_BASE_URL : VATLY_PRODUCTION_BASE_URL);

  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error(
      "Vatly: no `fetch` implementation found. Use Node 18+ or pass a custom `fetch`.",
    );
  }

  const idempotencyKeyGenerator =
    options.idempotencyKeyGenerator === false
      ? undefined
      : (options.idempotencyKeyGenerator ?? defaultIdempotencyKeyGenerator);

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    timeoutMs: options.timeoutMs ?? 30_000,
    maxRetries: options.maxRetries ?? 2,
    fetch: fetchImpl,
    defaultHeaders: options.defaultHeaders ?? {},
    userAgent: options.userAgent ?? `vatly-sdk-js/${SDK_VERSION}`,
    mode,
    clientInfoHeader: buildClientInfoHeader(options.clientInfo),
    idempotencyKeyGenerator,
  };
}

/**
 * Validate and parse a Vatly API key.
 *
 * Throws if the key doesn't match the `^(live|test)_[\w|]{18,}$` pattern.
 * Returns `"live"` or `"test"` based on the prefix.
 */
export function detectMode(apiKey: string): "live" | "test" {
  const match = API_KEY_REGEX.exec(apiKey);
  if (!match) {
    throw new Error(
      "Vatly: API key must start with `live_` or `test_` followed by at least 18 characters. " +
        "Production keys are issued at https://app.vatly.com.",
    );
  }
  return match[1] as "live" | "test";
}

/** Cryptographic UUID v4 generator; uses Web Crypto, no `node:crypto`. */
function defaultIdempotencyKeyGenerator(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }
  throw new Error(
    "Vatly: `crypto.randomUUID()` is unavailable. Provide a custom " +
      "`idempotencyKeyGenerator` or upgrade to Node 18.4+ / an edge runtime " +
      "that exposes Web Crypto.",
  );
}

// ---- X-Vatly-Client-Info -------------------------------------------------

interface DetectedRuntime {
  runtime: string;
  os?: string;
  arch?: string;
}

/** Detect the JS runtime in a way that survives all our supported targets. */
export function detectRuntime(): DetectedRuntime {
  const g = globalThis as unknown as {
    Bun?: { version?: string };
    Deno?: { version?: { deno?: string } };
    EdgeRuntime?: string;
    navigator?: { userAgent?: string };
  };

  // Bun sets both `process` and `Bun`; check Bun first.
  if (g.Bun && typeof g.Bun.version === "string") {
    return { runtime: `bun/${g.Bun.version}` };
  }
  if (g.Deno && g.Deno.version) {
    return { runtime: `deno/${g.Deno.version.deno ?? "?"}` };
  }
  // Cloudflare Workers expose this navigator UA reliably.
  if (g.navigator && g.navigator.userAgent === "Cloudflare-Workers") {
    return { runtime: "workers" };
  }
  // Vercel Edge & edge-runtime expose `EdgeRuntime` as a string.
  if (typeof g.EdgeRuntime === "string" && g.EdgeRuntime.length > 0) {
    return { runtime: `edge/${g.EdgeRuntime}` };
  }
  // Plain Node.
  if (typeof process !== "undefined" && process.versions?.node) {
    return {
      runtime: `node/${process.versions.node}`,
      os: process.platform,
      arch: process.arch,
    };
  }
  return { runtime: "unknown" };
}

/**
 * Build the `X-Vatly-Client-Info` header value.
 * Returns `undefined` to suppress the header (when `extras === false`).
 */
export function buildClientInfoHeader(
  extras: ClientInfoFragments | false | undefined,
): string | undefined {
  if (extras === false) return undefined;

  const detected = detectRuntime();
  const fragments: ClientInfoFragments = {
    sdk: `vatly-sdk-js/${SDK_VERSION}`,
    runtime: detected.runtime,
  };
  if (detected.os) fragments.os = detected.os;
  if (detected.arch) fragments.arch = detected.arch;

  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      if (typeof v === "string" && v.length > 0) fragments[k] = v;
      else if (v === undefined) delete fragments[k];
    }
  }

  const parts: string[] = [];
  for (const [k, v] of Object.entries(fragments)) {
    if (typeof v !== "string" || v.length === 0) continue;
    parts.push(`${sanitizeKey(k)}=${sanitizeValue(v)}`);
  }
  return parts.length > 0 ? parts.join("; ") : undefined;
}

/** Restrict keys to a safe subset so user input can't break header parsing. */
function sanitizeKey(k: string): string {
  return k.replace(/[^A-Za-z0-9_.-]/g, "_");
}

/** Strip header-breaking chars (CRLF, `;`, `,`) and collapse whitespace. */
function sanitizeValue(v: string): string {
  return v.replace(/[\r\n;,]/g, " ").replace(/\s+/g, " ").trim();
}
