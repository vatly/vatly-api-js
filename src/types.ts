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

export type OneOffProduct = Schemas["OneOffProduct"];
export type SubscriptionPlan = Schemas["SubscriptionPlan"];

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

export type WebhookEvent = Schemas["WebhookEvent"];

export type BillingAddress = Schemas["BillingAddress"];
export type BillingDetails = Schemas["BillingDetails"];
export type Metadata = Schemas["Metadata"];
export type PaginationLinks = Schemas["PaginationLinks"];
export type Link = Schemas["Link"];

export type TaxSummaryItem = Schemas["TaxSummaryItem"];
export type TaxSummaryRate = Schemas["TaxSummaryRate"];

export type { components, paths, operations } from "./generated/schema.js";
