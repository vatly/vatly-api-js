import { describe, expect, it } from "vitest";
import type { Order, Webhook } from "../types.js";
import {
  type VatlyWebhookEvent,
  WEBHOOK_EVENT_NAMES,
  WebhookEventName,
  constructWebhookEvent,
  constructWebhookEventFromRequest,
  isWebhookEventName,
  toWebhookEvent,
} from "./events.js";
import { VATLY_SIGNATURE_HEADER, computeSignatureV1 } from "./verify.js";

const SECRET = "whsec_test";
const FROZEN_T = 1_700_000_000;
const FROZEN_NOW = () => FROZEN_T;

async function signed(body: string): Promise<string> {
  return `t=${FROZEN_T},v1=${await computeSignatureV1(body, SECRET, FROZEN_T)}`;
}

const orderPaidBody = JSON.stringify({
  id: "webhook_event_1",
  resource: "webhook_event",
  eventName: "order.paid",
  entityType: "order",
  entityId: "order_1",
  object: { resource: "order", id: "order_1", status: "paid", customerId: "customer_1" },
  createdAt: "2026-05-21T14:32:08+00:00",
  testmode: false,
  links: {
    self: {
      href: "https://api.vatly.com/v1/webhook-events/webhook_event_1",
      type: "application/json",
    },
  },
});

const setupBody = JSON.stringify({
  id: "webhook_event_setup",
  resource: "webhook_event",
  eventName: "webhook.setup",
  entityType: "webhook",
  entityId: "webhook_1",
  object: {
    resource: "webhook",
    id: "webhook_1",
    url: "https://merchant.example/hook",
    testmode: true,
  },
  createdAt: "2026-05-21T14:32:08+00:00",
  testmode: true,
});

describe("webhook event factory", () => {
  describe("WebhookEventName catalogue", () => {
    it("exposes the canonical event names", () => {
      expect(WebhookEventName.OrderPaid).toBe("order.paid");
      expect(WebhookEventName.OrderPaymentFailed).toBe("order.payment_failed");
      expect(WebhookEventName.SubscriptionBillingUpdated).toBe("subscription.billing_updated");
      expect(WebhookEventName.WebhookSetup).toBe("webhook.setup");
    });

    it("WEBHOOK_EVENT_NAMES lists every event (32 incl. webhook.setup)", () => {
      expect(WEBHOOK_EVENT_NAMES).toHaveLength(32);
      expect(WEBHOOK_EVENT_NAMES).toContain("webhook.setup");
    });

    it("isWebhookEventName narrows known vs unknown", () => {
      expect(isWebhookEventName("order.paid")).toBe(true);
      expect(isWebhookEventName("order.not_a_real_event")).toBe(false);
    });
  });

  describe("constructWebhookEvent", () => {
    it("verifies and narrows object on eventName (order.paid → Order)", async () => {
      const event = await constructWebhookEvent(
        orderPaidBody,
        await signed(orderPaidBody),
        SECRET,
        {
          now: FROZEN_NOW,
        },
      );

      expect(event.eventName).toBe("order.paid");
      if (event.eventName === "order.paid") {
        // Compiles only if `object` narrowed to Order:
        const order: Order = event.object;
        expect(order.id).toBe("order_1");
        expect(order.customerId).toBe("customer_1");
      }
    });

    it("narrows webhook.setup → Webhook and keeps links optional", async () => {
      const event = await constructWebhookEvent(setupBody, await signed(setupBody), SECRET, {
        now: FROZEN_NOW,
      });

      expect(event.eventName).toBe("webhook.setup");
      if (event.eventName === "webhook.setup") {
        const webhook: Webhook = event.object;
        expect(webhook.url).toBe("https://merchant.example/hook");
      }
      expect(event.links).toBeUndefined();
    });
  });

  describe("constructWebhookEventFromRequest", () => {
    it("reads the signature off the Request and narrows", async () => {
      const request = new Request("https://merchant.example/hook", {
        method: "POST",
        body: orderPaidBody,
        headers: { [VATLY_SIGNATURE_HEADER]: await signed(orderPaidBody) },
      });
      const event = await constructWebhookEventFromRequest(request, SECRET, { now: FROZEN_NOW });
      expect(event.eventName).toBe("order.paid");
    });
  });

  describe("toWebhookEvent", () => {
    it("is pure narrowing (returns the same value, exhaustive switch type-checks)", () => {
      const delivery = JSON.parse(orderPaidBody);
      const event = toWebhookEvent(delivery);
      expect(event).toBe(delivery);

      // Exhaustiveness: the union is closed, so a fully-handled switch leaves
      // `never` in the default — this function compiling proves it.
      const describe = (e: VatlyWebhookEvent): string => {
        switch (e.eventName) {
          case "order.paid":
          case "order.canceled":
          case "order.payment_failed":
            return e.object.id;
          case "order.chargeback_received":
          case "order.chargeback_reversed":
            return e.object.id;
          case "refund.completed":
          case "refund.failed":
          case "refund.canceled":
            return e.object.id;
          case "subscription.started":
          case "subscription.billing_updated":
          case "subscription.canceled_immediately":
          case "subscription.canceled_with_grace_period":
          case "subscription.cancellation_grace_period_completed":
          case "subscription.resumed":
          case "subscription.canceled_for_nonpayment":
          case "subscription.updated":
          case "subscription.update_scheduled":
            return e.object.id;
          case "one_off_product.update_submitted":
          case "one_off_product.update_approved":
          case "one_off_product.update_rejected":
          case "one_off_product.archived":
          case "one_off_product.unarchived":
          case "subscription_plan.update_submitted":
          case "subscription_plan.update_approved":
          case "subscription_plan.update_rejected":
          case "subscription_plan.archived":
          case "subscription_plan.unarchived":
            return e.object.basePrice.value;
          case "checkout.paid":
          case "checkout.failed":
          case "checkout.canceled":
          case "checkout.expired":
            return e.object.id;
          case "webhook.setup":
            return e.object.url;
          default: {
            const _exhaustive: never = e;
            return _exhaustive;
          }
        }
      };
      expect(describe(event)).toBe("order_1");
    });
  });
});
