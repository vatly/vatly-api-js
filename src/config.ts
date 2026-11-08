export const VATLY_BASE_URL = "https://api.vatly.com/v1";

/**
 * Same regex enforced by `vatly/vatly-api-php` (`VatlyApiClient::setApiKey`).
 * 5-char prefix (`live_` / `test_`) plus at least 18 chars of `\w` or `|`.
 */
const API_KEY_REGEX = /^(live|test)_[\w|]{18,}$/;

/**
 * Function that produces an Idempotency-Key value. Called once per mutating
 * request that doesn't already have a caller-supplied key. The default uses
 * `crypto.randomUUID()`, available on Node 20+, Workers, Vercel Edge, Deno,
 * and Bun.
 */
export type IdempotencyKeyGenerator = () => string;

/**
 * Optional identifiers for the calling application. Merged into the
 * `Vatly-Client-Info` header alongside the auto-detected runtime/os/arch.
 * Each field is capped to keep header size predictable.
 */
export interface ClientInfo {
  /** Application identifier in `Name/Version` form. Truncated to 64 chars. */
  app?: string;
  /** Framework identifier in `Name/Version` form. Truncated to 64 chars. */
  framework?: string;
}

/** Maximum value length per ClientInfo field. */
const CLIENT_INFO_VALUE_MAX = 64;

export interface VatlyClientOptions {
  /**
   * Vatly API key. Must match `^(live|test)_[\w|]{18,}$`.
   * Falls back to the `VATLY_API_KEY` env var on Node.
   */
  apiKey?: string;
  /** Override the API base URL. Defaults to `https://api.vatly.com/v1`. */
  baseUrl?: string;
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
   * Generator for automatic `Idempotency-Key` headers on POST, PATCH, and DELETE.
   * - Default: a UUID v4 from `crypto.randomUUID()`.
   * - Pass a function to customize (e.g. inject a request-id from a tracer).
   * - Pass `false` to disable auto-generation; callers must then opt in
   *   per-call via `opts.idempotencyKey`. Mutations without a key will not
   *   be retried by the SDK.
   */
  idempotencyKeyGenerator?: IdempotencyKeyGenerator | false;
  /**
   * Identify the calling application in the `Vatly-Client-Info` header.
   * Merged on top of the auto-detected `runtime` / `os` / `arch` defaults:
   *
   *   new VatlyClient({ clientInfo: { app: "MyApp/1.2.3", framework: "Next.js/14" } });
   *   // Vatly-Client-Info: sdk=vatly-sdk-js/0.3.0-alpha.1; runtime=node/v25.9.0; os=darwin; arch=arm64; app=MyApp/1.2.3; framework=Next.js/14
   *
   * Pass `false` to omit the header entirely. If you need more named fields
   * (e.g. `region`, `cloud`), open an issue — we'll add them as constrained
   * named fields rather than reopening the free-form record.
   */
  clientInfo?: ClientInfo | false;
  /**
   * Allow `VatlyClient` to be instantiated in a browser context. Default false.
   *
   * Vatly keys are secret material; bundling them into a client-side app
   * leaks the key to every visitor. The SDK throws at construction if a
   * browser is detected. Set this to `true` only when you have a deliberate
   * reason (server-rendered hydration, testing through jsdom, etc.) AND
   * you've confirmed the key is not bundled into the client payload.
   */
  dangerouslyAllowBrowser?: boolean;
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

export const SDK_VERSION = "0.3.0-alpha.1";

function readEnvApiKey(): string | undefined {
  // `process` is undefined on some edge runtimes (Cloudflare Workers w/o nodejs_compat).
  // Guard via typeof to remain portable.
  if (typeof process !== "undefined" && process?.env) {
    return process.env.VATLY_API_KEY;
  }
  return undefined;
}

export function resolveConfig(options: VatlyClientOptions = {}): ResolvedConfig {
  if (isBrowser() && !options.dangerouslyAllowBrowser) {
    throw new Error(
      "Vatly: VatlyClient must not be instantiated in a browser. " +
        "API keys are secret and would leak to every visitor. " +
        "Use VatlyClient on a server (Node, Workers, Edge, Deno, Bun). " +
        "If you understand the risk and the key really is server-side, " +
        "pass `dangerouslyAllowBrowser: true`.",
    );
  }

  const apiKey = options.apiKey ?? readEnvApiKey();
  if (!apiKey || apiKey.length === 0) {
    throw new Error(
      "Vatly: missing API key. Pass `apiKey` to VatlyClient or set the VATLY_API_KEY env var.",
    );
  }

  const mode = detectMode(apiKey);

  const baseUrl = options.baseUrl ?? VATLY_BASE_URL;

  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error(
      "Vatly: no `fetch` implementation found. Use Node 20+ or pass a custom `fetch`.",
    );
  }

  const idempotencyKeyGenerator =
    options.idempotencyKeyGenerator === false
      ? undefined
      : (options.idempotencyKeyGenerator ?? defaultIdempotencyKeyGenerator);

  if (!Number.isFinite(options.timeoutMs ?? 30_000) || (options.timeoutMs ?? 30_000) < 0) {
    throw new RangeError("timeoutMs must be finite and non-negative.");
  }
  if (!Number.isSafeInteger(options.maxRetries ?? 2) || (options.maxRetries ?? 2) < 0) {
    throw new RangeError("maxRetries must be a non-negative safe integer.");
  }

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    timeoutMs: options.timeoutMs ?? 30_000,
    maxRetries: options.maxRetries ?? 2,
    // Workers' native fetch rejects invocation with the config object as `this`.
    fetch: fetchImpl.bind(globalThis),
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
      "`idempotencyKeyGenerator` or upgrade to Node 20+ / an edge runtime " +
      "that exposes Web Crypto.",
  );
}

/** Returns true iff running in a browser DOM context (not Workers/Edge/Deno/Node/jsdom). */
function isBrowser(): boolean {
  const g = globalThis as unknown as {
    window?: unknown;
    document?: { getElementById?: unknown };
    navigator?: { userAgent?: string };
  };
  // jsdom and HappyDOM define window+document but typically also identify via
  // navigator.userAgent containing "jsdom" / "happy-dom". We allow those so
  // the SDK is testable in DOM-emulating environments.
  if (typeof g.window === "undefined" || typeof g.document === "undefined") return false;
  const ua = g.navigator?.userAgent ?? "";
  if (/jsdom|happy-dom/i.test(ua)) return false;
  return true;
}

// ---- Vatly-Client-Info ---------------------------------------------------

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
  if (g.Deno?.version) {
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
 * Build the `Vatly-Client-Info` header value.
 * Returns `undefined` to suppress the header (when `info === false`).
 *
 * Defaults: `sdk`, `runtime`, `os`, `arch` (auto-detected).
 * Caller-provided: `app`, `framework` — each truncated to 64 chars after
 * stripping CR/LF/`;`/`,` and collapsing whitespace.
 */
export function buildClientInfoHeader(info: ClientInfo | false | undefined): string | undefined {
  if (info === false) return undefined;

  const detected = detectRuntime();
  const fragments: Array<[string, string]> = [
    ["sdk", `vatly-sdk-js/${SDK_VERSION}`],
    ["runtime", detected.runtime],
  ];
  if (detected.os) fragments.push(["os", detected.os]);
  if (detected.arch) fragments.push(["arch", detected.arch]);

  if (info?.app) {
    const v = sanitizeValue(info.app, CLIENT_INFO_VALUE_MAX);
    if (v) fragments.push(["app", v]);
  }
  if (info?.framework) {
    const v = sanitizeValue(info.framework, CLIENT_INFO_VALUE_MAX);
    if (v) fragments.push(["framework", v]);
  }

  const parts: string[] = [];
  for (const [k, v] of fragments) {
    if (v.length === 0) continue;
    parts.push(`${k}=${v}`);
  }
  return parts.length > 0 ? parts.join("; ") : undefined;
}

/**
 * Strip header-breaking chars (CR/LF, `;`, `,`), collapse whitespace, and
 * truncate to the given byte length.
 */
function sanitizeValue(v: string, maxLen: number): string {
  const cleaned = v
    .replace(/[\r\n;,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) : cleaned;
}
