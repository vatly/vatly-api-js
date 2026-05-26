/**
 * Typed error hierarchy for Vatly API responses.
 * The Vatly spec's Error schema is `{ message: string }` only; ValidationError adds
 * `errors: Record<string, string[]>`. There is NO `details` field — do not invent one.
 */

export interface VatlyErrorBody {
  message?: string;
  // ValidationError variant: field → array of messages.
  errors?: Record<string, string[]>;
  // We keep an open index so server-side additions don't break consumers, but the
  // shape above is the contract we rely on.
  [k: string]: unknown;
}

export interface VatlyErrorContext {
  status: number;
  body?: VatlyErrorBody | string;
  url?: string;
  method?: string;
}

export class VatlyError extends Error {
  readonly status: number;
  readonly body: VatlyErrorBody | string | undefined;
  readonly url: string | undefined;
  readonly method: string | undefined;

  constructor(message: string, ctx: VatlyErrorContext) {
    super(message);
    this.name = "VatlyError";
    this.status = ctx.status;
    this.body = ctx.body;
    this.url = ctx.url;
    this.method = ctx.method;
  }
}

export class VatlyAuthError extends VatlyError {
  constructor(ctx: VatlyErrorContext) {
    super(messageFrom(ctx) ?? "Authentication failed.", ctx);
    this.name = "VatlyAuthError";
  }
}

export class VatlyForbiddenError extends VatlyError {
  constructor(ctx: VatlyErrorContext) {
    super(messageFrom(ctx) ?? "Forbidden.", ctx);
    this.name = "VatlyForbiddenError";
  }
}

export class VatlyNotFoundError extends VatlyError {
  constructor(ctx: VatlyErrorContext) {
    super(messageFrom(ctx) ?? "Resource not found.", ctx);
    this.name = "VatlyNotFoundError";
  }
}

export class VatlyValidationError extends VatlyError {
  /** Field-keyed error messages from the server. */
  readonly errors: Record<string, string[]>;

  constructor(ctx: VatlyErrorContext) {
    super(messageFrom(ctx) ?? "Validation failed.", ctx);
    this.name = "VatlyValidationError";
    this.errors =
      typeof ctx.body === "object" && ctx.body !== null && ctx.body.errors ? ctx.body.errors : {};
  }
}

export class VatlyRateLimitError extends VatlyError {
  /** Seconds the server suggests waiting before retrying, parsed from `Retry-After`. */
  readonly retryAfter: number | undefined;

  constructor(ctx: VatlyErrorContext & { retryAfter?: number }) {
    super(messageFrom(ctx) ?? "Rate limited.", ctx);
    this.name = "VatlyRateLimitError";
    this.retryAfter = ctx.retryAfter;
  }
}

/** Catch-all for 4xx/5xx outside the specific classes above. */
export class VatlyApiError extends VatlyError {
  constructor(ctx: VatlyErrorContext) {
    super(messageFrom(ctx) ?? `Vatly API error (${ctx.status}).`, ctx);
    this.name = "VatlyApiError";
  }
}

/** Network-level failures (DNS, TLS, abort, etc.) — not an API response. */
export class VatlyConnectionError extends VatlyError {
  override readonly cause: unknown;
  constructor(message: string, cause: unknown) {
    super(message, { status: 0 });
    this.name = "VatlyConnectionError";
    this.cause = cause;
  }
}

export class VatlyTimeoutError extends VatlyConnectionError {
  constructor(timeoutMs: number, cause: unknown) {
    super(`Vatly request timed out after ${timeoutMs}ms`, cause);
    this.name = "VatlyTimeoutError";
  }
}

/** Thrown when a webhook signature fails verification. */
export class VatlyInvalidSignatureError extends Error {
  constructor(message = "Invalid webhook signature.") {
    super(message);
    this.name = "VatlyInvalidSignatureError";
  }
}

function messageFrom(ctx: VatlyErrorContext): string | undefined {
  if (typeof ctx.body === "object" && ctx.body !== null && typeof ctx.body.message === "string") {
    return ctx.body.message;
  }
  return undefined;
}

export function errorFromResponse(ctx: VatlyErrorContext & { retryAfter?: number }): VatlyError {
  switch (ctx.status) {
    case 401:
      return new VatlyAuthError(ctx);
    case 403:
      return new VatlyForbiddenError(ctx);
    case 404:
      return new VatlyNotFoundError(ctx);
    case 422:
      return new VatlyValidationError(ctx);
    case 429:
      return new VatlyRateLimitError(ctx);
    default:
      return new VatlyApiError(ctx);
  }
}
