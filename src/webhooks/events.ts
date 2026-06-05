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

import type { Chargeback, Checkout, Order, Refund, Subscription, Webhook } from "../types.js";
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
  SubscriptionCanceledImmediately: "subscription.canceled_immediately",
  SubscriptionCanceledWithGracePeriod: "subscription.canceled_with_grace_period",
  SubscriptionCancellationGracePeriodCompleted: "subscription.cancellation_grace_period_completed",
  SubscriptionResumed: "subscription.resumed",
  CheckoutPaid: "checkout.paid",
  CheckoutFailed: "checkout.failed",
  CheckoutCanceled: "checkout.canceled",
  CheckoutExpired: "checkout.expired",
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
  "subscription.canceled_immediately": Subscription;
  "subscription.canceled_with_grace_period": Subscription;
  "subscription.cancellation_grace_period_completed": Subscription;
  "subscription.resumed": Subscription;
  "checkout.paid": Checkout;
  "checkout.failed": Checkout;
  "checkout.canceled": Checkout;
  "checkout.expired": Checkout;
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
export type SubscriptionCanceledImmediatelyEvent =
  WebhookEventOfType<"subscription.canceled_immediately">;
export type SubscriptionCanceledWithGracePeriodEvent =
  WebhookEventOfType<"subscription.canceled_with_grace_period">;
export type SubscriptionCancellationGracePeriodCompletedEvent =
  WebhookEventOfType<"subscription.cancellation_grace_period_completed">;
export type SubscriptionResumedEvent = WebhookEventOfType<"subscription.resumed">;
export type CheckoutPaidEvent = WebhookEventOfType<"checkout.paid">;
export type CheckoutFailedEvent = WebhookEventOfType<"checkout.failed">;
export type CheckoutCanceledEvent = WebhookEventOfType<"checkout.canceled">;
export type CheckoutExpiredEvent = WebhookEventOfType<"checkout.expired">;
export type WebhookSetupEvent = WebhookEventOfType<"webhook.setup">;

/**
 * Refine an already-verified {@link WebhookDelivery} into a discriminated
 * {@link VatlyWebhookEvent}. Pure type narrowing — the runtime value is
 * unchanged (the spec guarantees the `eventName` → `object` correlation, which
 * the type system can't prove on its own).
 *
 * Use this when you verified the signature yourself (e.g. via `constructEvent`)
 * and want the narrowed event. To verify and narrow in one step, use
 * {@link constructWebhookEvent} / {@link constructWebhookEventFromRequest}.
 */
export function toWebhookEvent(delivery: WebhookDelivery): VatlyWebhookEvent {
  return delivery as VatlyWebhookEvent;
}

/**
 * Verify the signature and return a typed, discriminated {@link VatlyWebhookEvent}.
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
): Promise<VatlyWebhookEvent> {
  return toWebhookEvent(await constructEvent(rawBody, signatureHeader, secret, options));
}

/**
 * Verify a Fetch {@link Request} and return a typed, discriminated
 * {@link VatlyWebhookEvent}. The one-shot equivalent of
 * {@link constructEventFromRequest} + {@link toWebhookEvent}.
 */
export async function constructWebhookEventFromRequest(
  request: Request,
  secret: string | readonly string[],
  options?: VerifyOptions,
): Promise<VatlyWebhookEvent> {
  return toWebhookEvent(await constructEventFromRequest(request, secret, options));
}
