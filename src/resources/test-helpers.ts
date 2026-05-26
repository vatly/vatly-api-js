import type { RequestOptions } from "../http.js";
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

  /** POST /test-helpers/subscriptions/{id}/fast-forward-renewal */
  async fastForwardRenewal(subscriptionId: string, opts?: RequestOptions): Promise<unknown> {
    this.assertTestMode("fastForwardRenewal");
    return this.request<unknown>(
      {
        method: "POST",
        path: `/test-helpers/subscriptions/${encodeURIComponent(subscriptionId)}/fast-forward-renewal`,
      },
      opts,
    );
  }

  /** POST /test-helpers/mandated-payments/{transactionId}/simulate-failure */
  async simulatePaymentFailure(
    transactionId: string,
    body?: Record<string, unknown>,
    opts?: RequestOptions,
  ): Promise<unknown> {
    this.assertTestMode("simulatePaymentFailure");
    return this.request<unknown>(
      {
        method: "POST",
        path: `/test-helpers/mandated-payments/${encodeURIComponent(transactionId)}/simulate-failure`,
        body,
      },
      opts,
    );
  }
}
