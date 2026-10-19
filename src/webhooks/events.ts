/**
 * Webhook payload → typed event processing.
 *
 * Mirrors `vatly-api-php`'s `WebhookEventFactory`: takes a verified webhook
 * envelope and turns it into a typed, discriminated event you can `switch` on.
 *
 * Where the PHP SDK flattens each event into a curated DTO (it has no structural
 * typing from the spec), the TypeScript SDK correlates `eventName` → the full
 * generated resource. Switching on `event.eventName` narrows `event.object` to
 * the exact resource type — no casts, no follow-up API call. Vatly sends **fat,
 * HMAC-signed** payloads: `object` is byte-identical to the corresponding
 * `GET /…/{id}` body, so the signed payload is the authoritative snapshot.
 *
 * ```ts
 * const event = await constructWebhookEvent(rawBody, signature, secret);
 * switch (event.eventName) {
 *   case "order.paid":
 *     event.object.total;      // Money — fully typed, no cast
 *     break;
 *   case "subscription.billing_updated":
 *     event.object.mandate;    // Subscription
 *     break;
 *   case "webhook.setup":
 *     return ack();            // verification handshake — object is the Webhook config
 * }
 * ```
 */

import type {
  Chargeback,
  Checkout,
  OneOffProduct,
  Order,
  Refund,
  Subscription,
  SubscriptionPlan,
  Webhook,
} from "../types.js";
import type { WebhookDelivery } from "../types.js";
import {
  type RawBody,
  type VerifyOptions,
  constructEvent,
  constructEventFromRequest,
} from "./verify.js";

/**
 * Canonical webhook event-name constants. Mirrors vatlify's event catalogue
 * (`Vatly\API\Types\WebhookEventName`) so callers can reference
 * `WebhookEventName.OrderPaid` instead of hardcoding `"order.paid"`.
 */
export const WebhookEventName = {
  OrderPaid: "order.paid",
  OrderCanceled: "order.canceled",
  OrderChargebackReceived: "order.chargeback_received",
  OrderChargebackReversed: "order.chargeback_reversed",
  OrderPaymentFailed: "order.payment_failed",
  RefundCompleted: "refund.completed",
  RefundFailed: "refund.failed",
  RefundCanceled: "refund.canceled",
  SubscriptionStarted: "subscription.started",
  SubscriptionBillingUpdated: "subscription.billing_updated",
  SubscriptionUpdated: "subscription.updated",
  SubscriptionUpdateScheduled: "subscription.update_scheduled",
  SubscriptionCanceledImmediately: "subscription.canceled_immediately",
  SubscriptionCanceledForNonpayment: "subscription.canceled_for_nonpayment",
  SubscriptionCanceledWithGracePeriod: "subscription.canceled_with_grace_period",
  SubscriptionCancellationGracePeriodCompleted: "subscription.cancellation_grace_period_completed",
  SubscriptionResumed: "subscription.resumed",
  CheckoutPaid: "checkout.paid",
  CheckoutFailed: "checkout.failed",
  CheckoutCanceled: "checkout.canceled",
  CheckoutExpired: "checkout.expired",
  OneOffProductUpdateSubmitted: "one_off_product.update_submitted",
  OneOffProductUpdateApproved: "one_off_product.update_approved",
  OneOffProductUpdateRejected: "one_off_product.update_rejected",
  OneOffProductArchived: "one_off_product.archived",
  OneOffProductUnarchived: "one_off_product.unarchived",
  SubscriptionPlanUpdateSubmitted: "subscription_plan.update_submitted",
  SubscriptionPlanUpdateApproved: "subscription_plan.update_approved",
  SubscriptionPlanUpdateRejected: "subscription_plan.update_rejected",
  SubscriptionPlanArchived: "subscription_plan.archived",
  SubscriptionPlanUnarchived: "subscription_plan.unarchived",
  /**
   * Verification call sent when an endpoint is registered or its URL changes.
   * Delivered as a normal signed webhook with `entityType: "webhook"`; just
   * acknowledge it (2xx) — there is no event-specific action to take.
   */
  WebhookSetup: "webhook.setup",
} as const;

export type WebhookEventName = (typeof WebhookEventName)[keyof typeof WebhookEventName];

/** Every event name, as a runtime array (mirrors PHP's `getSupportedEvents()`). */
export const WEBHOOK_EVENT_NAMES = Object.values(WebhookEventName) as readonly WebhookEventName[];

/** Narrowing guard for an arbitrary string (mirrors PHP's `isSupported()`). */
export function isWebhookEventName(name: string): name is WebhookEventName {
  return (WEBHOOK_EVENT_NAMES as readonly string[]).includes(name);
}

/**
 * The `eventName` → `object` resource correlation, per the spec's discriminator
 * documentation on `WebhookDelivery.object`. This is the single source of truth
 * the typed-event union is built from.
 */
interface EventObjectMap {
  "order.paid": Order;
  "order.canceled": Order;
  "order.payment_failed": Order;
  "order.chargeback_received": Chargeback;
  "order.chargeback_reversed": Chargeback;
  "refund.completed": Refund;
  "refund.failed": Refund;
  "refund.canceled": Refund;
  "subscription.started": Subscription;
  "subscription.billing_updated": Subscription;
  "subscription.updated": Subscription;
  "subscription.update_scheduled": Subscription;
  "subscription.canceled_immediately": Subscription;
  "subscription.canceled_for_nonpayment": Subscription;
  "subscription.canceled_with_grace_period": Subscription;
  "subscription.cancellation_grace_period_completed": Subscription;
  "subscription.resumed": Subscription;
  "checkout.paid": Checkout;
  "checkout.failed": Checkout;
  "checkout.canceled": Checkout;
  "checkout.expired": Checkout;
  "one_off_product.update_submitted": OneOffProduct;
  "one_off_product.update_approved": OneOffProduct;
  "one_off_product.update_rejected": OneOffProduct;
  "one_off_product.archived": OneOffProduct;
  "one_off_product.unarchived": OneOffProduct;
  "subscription_plan.update_submitted": SubscriptionPlan;
  "subscription_plan.update_approved": SubscriptionPlan;
  "subscription_plan.update_rejected": SubscriptionPlan;
  "subscription_plan.archived": SubscriptionPlan;
  "subscription_plan.unarchived": SubscriptionPlan;
  "webhook.setup": Webhook;
}

/**
 * Compile-time guard that `EventObjectMap` stays exhaustive against the
 * generated `WebhookDelivery.eventName` enum. If vatlify adds or renames an
 * event, regenerating `schema.ts` makes one of these fail until the map above
 * is updated — so the typed-event union can never silently drift from the spec.
 */
type AssertExtends<A extends B, B> = A extends B ? true : never;
type _AllEventNamesMapped = AssertExtends<WebhookDelivery["eventName"], keyof EventObjectMap>;
type _NoExtraEventNames = AssertExtends<keyof EventObjectMap, WebhookDelivery["eventName"]>;

/** The webhook envelope, minus the two fields the typed union refines. */
export type WebhookEventEnvelope = Omit<WebhookDelivery, "eventName" | "object">;

/** A single typed event: the envelope plus a narrowed `eventName` / `object` pair. */
export type WebhookEventOfType<K extends WebhookEventName> = WebhookEventEnvelope & {
  eventName: K;
  object: EventObjectMap[K];
};

/**
 * A verified webhook delivery, discriminated by `eventName`. Switching on
 * `eventName` narrows `object` to the matching resource type.
 */
export type VatlyWebhookEvent = {
  [K in WebhookEventName]: WebhookEventOfType<K>;
}[WebhookEventName];

/**
 * A verified webhook delivery whose `eventName` isn't in the catalogue this
 * SDK version knows about — Vatly ships a new event, your SDK is older, and
 * the delivery arrives before you upgrade. `object` is typed as `unknown`
 * because the SDK has no shape to narrow it to.
 *
 * Treat it as a soft notice: log the `eventName` for triage, acknowledge the
 * webhook with 2xx so Vatly doesn't retry, and plan to upgrade the SDK.
 */
export interface UnsupportedWebhookEvent extends WebhookEventEnvelope {
  eventName: string;
  object: unknown;
}

/**
 * The union {@link toWebhookEvent} actually returns at runtime: a known typed
 * event, or {@link UnsupportedWebhookEvent} when the delivery's `eventName` is
 * one this SDK release doesn't recognize. Narrow with {@link isKnownWebhookEvent}
 * before switching on `eventName`.
 */
export type MaybeUnsupportedWebhookEvent = VatlyWebhookEvent | UnsupportedWebhookEvent;

/** Type guard: true when the event is one of the SDK's known catalogue entries. */
export function isKnownWebhookEvent(
  event: MaybeUnsupportedWebhookEvent,
): event is VatlyWebhookEvent {
  return isWebhookEventName(event.eventName);
}

/** Convenience inverse of {@link isKnownWebhookEvent} for `.filter()` ergonomics. */
export function isUnsupportedWebhookEvent(
  event: MaybeUnsupportedWebhookEvent,
): event is UnsupportedWebhookEvent {
  return !isWebhookEventName(event.eventName);
}

// Named per-event aliases (mirror the PHP event DTO classes), for callers that
// want to annotate a handler with a single event's type.
export type OrderPaidEvent = WebhookEventOfType<"order.paid">;
export type OrderCanceledEvent = WebhookEventOfType<"order.canceled">;
export type OrderPaymentFailedEvent = WebhookEventOfType<"order.payment_failed">;
export type OrderChargebackReceivedEvent = WebhookEventOfType<"order.chargeback_received">;
export type OrderChargebackReversedEvent = WebhookEventOfType<"order.chargeback_reversed">;
export type RefundCompletedEvent = WebhookEventOfType<"refund.completed">;
export type RefundFailedEvent = WebhookEventOfType<"refund.failed">;
export type RefundCanceledEvent = WebhookEventOfType<"refund.canceled">;
export type SubscriptionStartedEvent = WebhookEventOfType<"subscription.started">;
export type SubscriptionBillingUpdatedEvent = WebhookEventOfType<"subscription.billing_updated">;
export type SubscriptionUpdatedEvent = WebhookEventOfType<"subscription.updated">;
export type SubscriptionUpdateScheduledEvent = WebhookEventOfType<"subscription.update_scheduled">;
export type SubscriptionCanceledImmediatelyEvent =
  WebhookEventOfType<"subscription.canceled_immediately">;
export type SubscriptionCanceledForNonpaymentEvent =
  WebhookEventOfType<"subscription.canceled_for_nonpayment">;
export type SubscriptionCanceledWithGracePeriodEvent =
  WebhookEventOfType<"subscription.canceled_with_grace_period">;
export type SubscriptionCancellationGracePeriodCompletedEvent =
  WebhookEventOfType<"subscription.cancellation_grace_period_completed">;
export type SubscriptionResumedEvent = WebhookEventOfType<"subscription.resumed">;
export type CheckoutPaidEvent = WebhookEventOfType<"checkout.paid">;
export type CheckoutFailedEvent = WebhookEventOfType<"checkout.failed">;
export type CheckoutCanceledEvent = WebhookEventOfType<"checkout.canceled">;
export type CheckoutExpiredEvent = WebhookEventOfType<"checkout.expired">;
export type OneOffProductUpdateSubmittedEvent =
  WebhookEventOfType<"one_off_product.update_submitted">;
export type OneOffProductUpdateApprovedEvent =
  WebhookEventOfType<"one_off_product.update_approved">;
export type OneOffProductUpdateRejectedEvent =
  WebhookEventOfType<"one_off_product.update_rejected">;
export type OneOffProductArchivedEvent = WebhookEventOfType<"one_off_product.archived">;
export type OneOffProductUnarchivedEvent = WebhookEventOfType<"one_off_product.unarchived">;
export type SubscriptionPlanUpdateSubmittedEvent =
  WebhookEventOfType<"subscription_plan.update_submitted">;
export type SubscriptionPlanUpdateApprovedEvent =
  WebhookEventOfType<"subscription_plan.update_approved">;
export type SubscriptionPlanUpdateRejectedEvent =
  WebhookEventOfType<"subscription_plan.update_rejected">;
export type SubscriptionPlanArchivedEvent = WebhookEventOfType<"subscription_plan.archived">;
export type SubscriptionPlanUnarchivedEvent = WebhookEventOfType<"subscription_plan.unarchived">;
export type WebhookSetupEvent = WebhookEventOfType<"webhook.setup">;

/**
 * Refine an already-verified {@link WebhookDelivery} into a discriminated
 * event. Returns {@link VatlyWebhookEvent} when `eventName` is in the SDK's
 * catalogue, {@link UnsupportedWebhookEvent} otherwise. Runtime check only —
 * no field is mutated.
 *
 * `WebhookDelivery["eventName"]` is a closed union generated from the spec at
 * SDK-build time, but the live wire can carry a newer name if Vatly ships an
 * event between SDK releases. Guarding here keeps consumers from falling into
 * the `never` default of an exhaustive `switch` on `eventName`.
 *
 * Use this when you verified the signature yourself (e.g. via `constructEvent`)
 * and want the narrowed event. To verify and narrow in one step, use
 * {@link constructWebhookEvent} / {@link constructWebhookEventFromRequest}.
 *
 * ```ts
 * const event = toWebhookEvent(delivery);
 * if (!isKnownWebhookEvent(event)) {
 *   log.info("unknown vatly event", { eventName: event.eventName });
 *   return ack();
 * }
 * switch (event.eventName) {
 *   case "order.paid": ... // narrows event.object to Order
 * }
 * ```
 */
export function toWebhookEvent(delivery: WebhookDelivery): MaybeUnsupportedWebhookEvent {
  if (isWebhookEventName(delivery.eventName)) return delivery as VatlyWebhookEvent;
  return delivery as unknown as UnsupportedWebhookEvent;
}

/**
 * Verify the signature and return a typed event, falling back to
 * {@link UnsupportedWebhookEvent} for a never-before-seen `eventName`.
 *
 * The one-shot equivalent of {@link constructEvent} + {@link toWebhookEvent}.
 * Pass the RAW request body — reserialising the JSON changes the bytes and
 * breaks the HMAC.
 */
export async function constructWebhookEvent(
  rawBody: RawBody,
  signatureHeader: string | null | undefined,
  secret: string | readonly string[],
  options?: VerifyOptions,
): Promise<MaybeUnsupportedWebhookEvent> {
  return toWebhookEvent(await constructEvent(rawBody, signatureHeader, secret, options));
}

/**
 * Verify a Fetch {@link Request} and return a typed event, falling back to
 * {@link UnsupportedWebhookEvent} for a never-before-seen `eventName`. The
 * one-shot equivalent of {@link constructEventFromRequest} + {@link toWebhookEvent}.
 */
export async function constructWebhookEventFromRequest(
  request: Request,
  secret: string | readonly string[],
  options?: VerifyOptions,
): Promise<MaybeUnsupportedWebhookEvent> {
  return toWebhookEvent(await constructEventFromRequest(request, secret, options));
}
