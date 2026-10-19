/**
 * Convenience re-exports of generated schemas so consumers don't need to
 * navigate `components["schemas"]["..."]` manually.
 */
import type { components } from "./generated/schema.js";

type Schemas = components["schemas"];

export type Checkout = Schemas["Checkout"];
export type CheckoutProduct = Schemas["CheckoutProduct"];
export type CreateCheckoutRequest = Schemas["CreateCheckoutRequest"];

export type Customer = Schemas["Customer"];
export type CreateCustomerRequest = Schemas["CreateCustomerRequest"];
export type UpdateCustomerRequest = Schemas["UpdateCustomerRequest"];
export type CreatePortalSessionRequest = Schemas["CreatePortalSessionRequest"];
export type PortalSession = Schemas["PortalSession"];

export type OneOffProduct = Schemas["OneOffProduct"];
/**
 * Hand-adjusted: `taxBehavior` carries a server default (`exclusive`), which
 * `openapi-typescript` v7 marks as required. The spec itself leaves it optional.
 */
export type CreateOneOffProductRequest = Omit<
  Schemas["CreateOneOffProductRequest"],
  "taxBehavior"
> & {
  taxBehavior?: Schemas["CreateOneOffProductRequest"]["taxBehavior"];
};
export type UpdateOneOffProductRequest = Schemas["UpdateOneOffProductRequest"];
export type SubscriptionPlan = Schemas["SubscriptionPlan"];
/** Hand-adjusted for `taxBehavior` — see {@link CreateOneOffProductRequest}. */
export type CreateSubscriptionPlanRequest = Omit<
  Schemas["CreateSubscriptionPlanRequest"],
  "taxBehavior"
> & {
  taxBehavior?: Schemas["CreateSubscriptionPlanRequest"]["taxBehavior"];
};
export type UpdateSubscriptionPlanRequest = Schemas["UpdateSubscriptionPlanRequest"];

export type EurMoney = Schemas["EurMoney"];

export type Order = Schemas["Order"];
export type OrderLine = Schemas["OrderLine"];
export type InvoiceUpdateLink = Schemas["InvoiceUpdateLink"];

export type Refund = Schemas["Refund"];
export type RefundLine = Schemas["RefundLine"];
export type RefundItem = Schemas["RefundItem"];
export type CreateRefundRequest = Schemas["CreateRefundRequest"];
export type CreateFullRefundRequest = Schemas["CreateFullRefundRequest"];

export type Chargeback = Schemas["Chargeback"];

export type Subscription = Schemas["Subscription"];
export type UpdateSubscriptionRequest = Schemas["UpdateSubscriptionRequest"];
export type UpdateSubscriptionBillingRequest = Schemas["UpdateSubscriptionBillingRequest"];

/**
 * The persisted webhook event resource, as returned by `GET /webhook-events`.
 * Requires `links` and never carries the `webhook.setup` verification call.
 * For the envelope Vatly POSTs to your endpoint, use {@link WebhookDelivery}.
 */
export type WebhookEvent = Schemas["WebhookEvent"];

/**
 * The envelope Vatly POSTs to your configured webhook endpoint for each
 * delivery — the type returned by `constructEvent` / `constructEventFromRequest`.
 * Differs from the persisted {@link WebhookEvent} on the wire: it additionally
 * covers the `webhook.setup` verification call (`object` is a {@link Webhook}
 * endpoint config) and `links` is optional (the setup call is not persisted).
 */
export type WebhookDelivery = Schemas["WebhookDelivery"];

export type Webhook = Schemas["Webhook"];

/** Managed webhook-endpoint config returned by `/webhook-endpoints` CRUD. */
export type WebhookEndpoint = Schemas["WebhookEndpoint"];
export type CreateWebhookEndpointRequest = Schemas["CreateWebhookEndpointRequest"];
export type UpdateWebhookEndpointRequest = Schemas["UpdateWebhookEndpointRequest"];
/**
 * Subscribable webhook event names, as a string-literal union. Deliberately
 * excludes `webhook.setup`, which is always delivered and cannot be chosen.
 */
export type WebhookSubscriptionEventName = Schemas["WebhookSubscriptionEventName"];

/**
 * Request body for `POST /test-helpers/orders/{orderId}/simulate-payment`.
 *
 * Hand-adjusted from the generated schema: `failureReason` carries a server
 * default (`general_failure`), which `openapi-typescript` v7 marks as required.
 * The spec itself leaves it optional, so we restore that here.
 */
export type SimulateOrderPaymentRequest = Omit<
  Schemas["SimulateOrderPaymentRequest"],
  "failureReason"
> & {
  failureReason?: Schemas["SimulateOrderPaymentRequest"]["failureReason"];
};

/**
 * Request body for `POST /test-helpers/subscriptions/{id}/fast-forward-renewal`.
 *
 * Same `failureReason` fix as {@link SimulateOrderPaymentRequest}.
 */
export type FastForwardSubscriptionRenewalRequest = Omit<
  Schemas["FastForwardSubscriptionRenewalRequest"],
  "failureReason"
> & {
  failureReason?: Schemas["FastForwardSubscriptionRenewalRequest"]["failureReason"];
};

export type BillingAddress = Schemas["BillingAddress"];
export type BillingDetails = Schemas["BillingDetails"];
export type Metadata = Schemas["Metadata"];
export type PaginationLinks = Schemas["PaginationLinks"];
export type Link = Schemas["Link"];

export type TaxSummaryItem = Schemas["TaxSummaryItem"];
export type TaxSummaryRate = Schemas["TaxSummaryRate"];

export type { components, paths, operations } from "./generated/schema.js";
