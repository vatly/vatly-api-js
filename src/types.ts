/**
 * Convenience re-exports of generated schemas so consumers don't need to
 * navigate `components["schemas"]["..."]` manually.
 */
import type { components, operations } from "./generated/schema.js";

type Schemas = components["schemas"];

export type Checkout = Schemas["Checkout"];
export type CheckoutProduct = Schemas["CheckoutProduct"];
export type CreateCheckoutRequest = Schemas["CreateCheckoutRequest"];

export type Customer = Schemas["Customer"];
export type CustomerListParams = NonNullable<operations["listCustomers"]["parameters"]["query"]>;
export type CreateCustomerRequest = Schemas["CreateCustomerRequest"];
export type UpdateCustomerRequest = Schemas["UpdateCustomerRequest"];
export type CreatePortalSessionRequest = Schemas["CreatePortalSessionRequest"];
export type PortalSession = Schemas["PortalSession"];

export type OneOffProduct = Schemas["OneOffProduct"];
export type CreateOneOffProductRequest = Schemas["CreateOneOffProductRequest"];
export type UpdateOneOffProductRequest = Schemas["UpdateOneOffProductRequest"];
export type SubscriptionPlan = Schemas["SubscriptionPlan"];
export type CreateSubscriptionPlanRequest = Schemas["CreateSubscriptionPlanRequest"];
export type UpdateSubscriptionPlanRequest = Schemas["UpdateSubscriptionPlanRequest"];
export type OneOffProductListParams = NonNullable<
  operations["listOneOffProducts"]["parameters"]["query"]
>;
export type SubscriptionPlanListParams = NonNullable<
  operations["listSubscriptionPlans"]["parameters"]["query"]
>;

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
export type SubscriptionBillingUpdateLink =
  operations["createSubscriptionBillingUpdateLink"]["responses"][200]["content"]["application/json"];
export type CancelSubscriptionParams = NonNullable<
  operations["cancelSubscription"]["parameters"]["query"]
>;
export type Mandate = Schemas["Mandate"];
export type FastForwardSubscriptionRenewalRequest =
  Schemas["FastForwardSubscriptionRenewalRequest"];
export type SimulateOrderPaymentRequest = Schemas["SimulateOrderPaymentRequest"];
export type EurMoney = Schemas["EurMoney"];

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
export type WebhookEndpoint = Schemas["WebhookEndpoint"];
export type CreateWebhookEndpointRequest = Schemas["CreateWebhookEndpointRequest"];
export type UpdateWebhookEndpointRequest = Schemas["UpdateWebhookEndpointRequest"];
export type WebhookSubscriptionEventName = Schemas["WebhookSubscriptionEventName"];

export type BillingAddress = Schemas["BillingAddress"];
export type BillingDetails = Schemas["BillingDetails"];
export type Metadata = Schemas["Metadata"];
export type PaginationLinks = Schemas["PaginationLinks"];
export type Link = Schemas["Link"];

export type TaxSummaryItem = Schemas["TaxSummaryItem"];
export type TaxSummaryRate = Schemas["TaxSummaryRate"];

export type { components, paths, operations } from "./generated/schema.js";
