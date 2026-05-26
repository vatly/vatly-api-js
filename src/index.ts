export { VatlyClient } from "./client.js";
export {
  VATLY_PRODUCTION_BASE_URL,
  VATLY_STAGING_BASE_URL,
  buildClientInfoHeader,
  detectMode,
  detectRuntime,
  type ClientInfoFragments,
  type IdempotencyKeyGenerator,
  type VatlyClientOptions,
  type VatlyServer,
} from "./config.js";

export {
  VatlyError,
  VatlyAuthError,
  VatlyForbiddenError,
  VatlyNotFoundError,
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

export { paginate, extractStartingAfter, type ListParams, type PaginatedList } from "./pagination.js";

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

export * from "./types.js";
