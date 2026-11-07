/**
 * Typed request-body fixtures used by tests.
 *
 * These factories return objects that satisfy the generated request types
 * BYTE-for-byte. If a future `pnpm gen` adds a required field, the fixture
 * stops compiling — and the failing test build is the bug report.
 *
 * Test files MUST go through these factories. Do NOT inline `{} as never`
 * casts that bypass the schema; that was the whole point of moving here.
 */

import type {
  CreateCheckoutRequest,
  CreateCustomerRequest,
  UpdateSubscriptionRequest,
} from "../types.js";

/** Minimal-valid `CreateCheckoutRequest`. */
export function aCreateCheckoutRequest(
  overrides: Partial<CreateCheckoutRequest> = {},
): CreateCheckoutRequest {
  return {
    redirectUrlSuccess: "https://example.com/success",
    redirectUrlCanceled: "https://example.com/canceled",
    products: [{ id: "one_off_product_Vr8kQdFhSrG4Y3DnfsdqH", quantity: 1 }],
    ...overrides,
  };
}

/** Minimal-valid `CreateCustomerRequest`. */
export function aCreateCustomerRequest(
  overrides: Partial<CreateCustomerRequest> = {},
): CreateCustomerRequest {
  return {
    email: "customer@example.com",
    ...overrides,
  };
}

/**
 * `UpdateSubscriptionRequest` has no required fields at the schema level
 * (the "at least one of plan/quantity" rule is server-enforced), but tests
 * usually want a realistic shape. Defaults to a plan switch.
 */
export function anUpdateSubscriptionRequest(
  overrides: Partial<UpdateSubscriptionRequest> = {},
): UpdateSubscriptionRequest {
  return {
    subscriptionPlanId: "subscription_plan_Wt5mNvBxKw7YcZaEjLhR",
    ...overrides,
  };
}
