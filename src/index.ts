export { VatlyClient } from "./client.js";
export type { RequestOptions } from "./http.js";
export {
  VATLY_BASE_URL,
  buildClientInfoHeader,
  detectMode,
  detectRuntime,
  type ClientInfo,
  type IdempotencyKeyGenerator,
  type VatlyClientOptions,
} from "./config.js";

export {
  VatlyError,
  VatlyAuthError,
  VatlyForbiddenError,
  VatlyNotFoundError,
  VatlyConflictError,
  VatlyValidationError,
  VatlyRateLimitError,
  VatlyApiError,
  VatlyConnectionError,
  VatlyTimeoutError,
  VatlyInvalidSignatureError,
  type VatlyErrorBody,
} from "./errors.js";

export {
  type Money,
  toMinorUnits,
  fromMinorUnits,
  moneyEquals,
} from "./money.js";

export {
  paginate,
  extractStartingAfter,
  type ListParams,
  type PaginatedList,
} from "./pagination.js";

export {
  decodeDomain,
  decodeEmail,
  encodeDomain,
  encodeEmail,
} from "./email.js";

export {
  VATLY_EVENT_ID_HEADER,
  VATLY_SIGNATURE_HEADER,
  computeSignatureV1,
  constructEvent,
  constructEventFromRequest,
  isValidWebhookSignature,
  parseSignatureHeader,
  verifyWebhookSignature,
  type ParsedSignatureHeader,
  type RawBody,
  type VerifyOptions,
} from "./webhooks/verify.js";

export * from "./webhooks/events.js";

export * from "./types.js";
