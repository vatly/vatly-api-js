import type { RequestOptions } from "../http.js";
import type {
  FastForwardSubscriptionRenewalRequest,
  Order,
  SimulateOrderPaymentRequest,
  Subscription,
} from "../types.js";
import { BaseResource } from "./base.js";

/**
 * Test-mode-only helpers. The Vatly API rejects these against `live_` tokens,
 * but we also guard client-side so a misconfigured production deploy fails
 * fast with a clear message instead of leaking a request.
 */
export class TestHelpersResource extends BaseResource {
  private assertTestMode(method: string): void {
    if (this.config.mode !== "test") {
      throw new Error(
        `Vatly: testHelpers.${method} can only be called with a test-mode API key ` +
          `(starts with 'test_'). Current key is in '${this.config.mode}' mode.`,
      );
    }
  }

  /**
   * POST /test-helpers/subscriptions/{id}/fast-forward-renewal
   *
   * Advances the subscription's billing cycle and creates a local pending
   * renewal payment. Pass a body to simulate a deterministic payment outcome:
   * `{ paymentStatus: "paid" }` settles the renewal; `{ paymentStatus: "failed",
   * failureReason? }` declines it and starts payment recovery.
   */
  async fastForwardRenewal(
    subscriptionId: string,
    body?: FastForwardSubscriptionRenewalRequest,
    opts?: RequestOptions,
  ): Promise<Subscription> {
    this.assertTestMode("fastForwardRenewal");
    return this.request<Subscription>(
      {
        method: "POST",
        path: `/test-helpers/subscriptions/${encodeURIComponent(subscriptionId)}/fast-forward-renewal`,
        body,
      },
      opts,
    );
  }

  /**
   * POST /test-helpers/orders/{orderId}/simulate-payment
   *
   * Settles or declines a test order's pending payment. Only works on orders
   * charged to a saved payment method (subscription renewals, immediately
   * invoiced subscription updates). Replaces the old `simulatePaymentFailure`
   * helper on `/test-helpers/mandated-payments/{id}/simulate-failure`, which
   * the API no longer exposes.
   */
  async simulateOrderPayment(
    orderId: string,
    body: SimulateOrderPaymentRequest,
    opts?: RequestOptions,
  ): Promise<Order> {
    this.assertTestMode("simulateOrderPayment");
    return this.request<Order>(
      {
        method: "POST",
        path: `/test-helpers/orders/${encodeURIComponent(orderId)}/simulate-payment`,
        body,
      },
      opts,
    );
  }
}
