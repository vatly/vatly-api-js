import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import type { VatlyClient } from "../client.js";
import { makeTestClient } from "../test-utils.js";
import { WEBHOOK_EVENT_NAMES } from "../webhooks/events.js";

// The production snapshot, not SDK route strings, supplies expected methods,
// paths and success status codes. Adding an API operation requires a client case.
const spec = parse(readFileSync(new URL("../../openapi.yaml", import.meta.url), "utf8"));
const ids = {
  checkoutId: "checkout /?",
  customerId: "customer /?",
  subscriptionId: "subscription /?",
  oneOffProductId: "product /?",
  subscriptionPlanId: "plan /?",
  orderId: "order /?",
  refundId: "refund /?",
  chargebackId: "chargeback /?",
  eventId: "event /?",
  webhookEndpointId: "webhook /?",
};
const product = {
  name: "Example",
  description: "A license",
  basePrice: { value: "12.34", currency: "EUR" as const },
  productType: "saas" as const,
};
const plan = { ...product, interval: "month" as const, intervalCount: 3 };
const checkout = {
  products: [{ id: "product_1", quantity: 3 }],
  redirectUrlSuccess: "https://example.com/ok",
  redirectUrlCanceled: "https://example.com/no",
};
const hook = {
  url: "https://example.com/hook",
  secret: "example-signing-secret-not-a-credential",
  enabledEvents: ["order.paid" as const],
};
const billing = {
  redirectUrlSuccess: "https://example.com/ok",
  redirectUrlCanceled: "https://example.com/no",
};
const refund = {
  items: [{ itemId: "line_1", amount: { value: "1.23", currency: "EUR" as const } }],
};
type Case = [(client: VatlyClient) => Promise<unknown>, unknown?];
const cases: Record<string, Case> = {
  listCheckouts: [(c) => c.checkouts.list()],
  createCheckout: [(c) => c.checkouts.create(checkout), checkout],
  getCheckout: [(c) => c.checkouts.get(ids.checkoutId)],
  listCustomers: [(c) => c.customers.list()],
  createCustomer: [
    (c) => c.customers.create({ email: "ada@example.com" }),
    { email: "ada@example.com" },
  ],
  getCustomer: [(c) => c.customers.get(ids.customerId)],
  updateCustomer: [(c) => c.customers.update(ids.customerId, { name: "Ada" }), { name: "Ada" }],
  createCustomerPortalSession: [
    (c) =>
      c.customers.createPortalSession(ids.customerId, { returnUrl: "https://example.com/account" }),
    { returnUrl: "https://example.com/account" },
  ],
  listCustomerSubscriptions: [(c) => c.customers.listSubscriptions(ids.customerId)],
  getCustomerSubscription: [(c) => c.customers.getSubscription(ids.customerId, ids.subscriptionId)],
  listOneOffProducts: [(c) => c.oneOffProducts.list()],
  createOneOffProduct: [(c) => c.oneOffProducts.create(product), product],
  getOneOffProduct: [(c) => c.oneOffProducts.get(ids.oneOffProductId)],
  updateOneOffProduct: [
    (c) => c.oneOffProducts.update(ids.oneOffProductId, { name: "Updated" }),
    { name: "Updated" },
  ],
  archiveOneOffProduct: [(c) => c.oneOffProducts.archive(ids.oneOffProductId)],
  unarchiveOneOffProduct: [(c) => c.oneOffProducts.unarchive(ids.oneOffProductId)],
  listSubscriptionPlans: [(c) => c.subscriptionPlans.list()],
  createSubscriptionPlan: [(c) => c.subscriptionPlans.create(plan), plan],
  getSubscriptionPlan: [(c) => c.subscriptionPlans.get(ids.subscriptionPlanId)],
  updateSubscriptionPlan: [
    (c) => c.subscriptionPlans.update(ids.subscriptionPlanId, { intervalCount: 2 }),
    { intervalCount: 2 },
  ],
  archiveSubscriptionPlan: [(c) => c.subscriptionPlans.archive(ids.subscriptionPlanId)],
  unarchiveSubscriptionPlan: [(c) => c.subscriptionPlans.unarchive(ids.subscriptionPlanId)],
  listOrders: [(c) => c.orders.list()],
  getOrder: [(c) => c.orders.get(ids.orderId)],
  createOrderInvoiceUpdateLink: [(c) => c.orders.createInvoiceUpdateLink(ids.orderId)],
  listOrderRefunds: [(c) => c.orders.listRefunds(ids.orderId)],
  createOrderRefund: [(c) => c.orders.createRefund(ids.orderId, refund), refund],
  createFullOrderRefund: [(c) => c.orders.createFullRefund(ids.orderId), {}],
  getOrderRefund: [(c) => c.orders.getRefund(ids.orderId, ids.refundId)],
  cancelOrderRefund: [(c) => c.orders.cancelRefund(ids.orderId, ids.refundId)],
  listOrderChargebacks: [(c) => c.orders.listChargebacks(ids.orderId)],
  getOrderChargeback: [(c) => c.orders.getChargeback(ids.orderId, ids.chargebackId)],
  listRefunds: [(c) => c.refunds.list()],
  getRefund: [(c) => c.refunds.get(ids.refundId)],
  listChargebacks: [(c) => c.chargebacks.list()],
  getChargeback: [(c) => c.chargebacks.get(ids.chargebackId)],
  getWebhookEvent: [(c) => c.webhookEvents.get(ids.eventId)],
  listWebhookEndpoints: [(c) => c.webhookEndpoints.list()],
  createWebhookEndpoint: [(c) => c.webhookEndpoints.create(hook), hook],
  getWebhookEndpoint: [(c) => c.webhookEndpoints.get(ids.webhookEndpointId)],
  updateWebhookEndpoint: [
    (c) => c.webhookEndpoints.update(ids.webhookEndpointId, { enabledEvents: [] }),
    { enabledEvents: [] },
  ],
  deleteWebhookEndpoint: [(c) => c.webhookEndpoints.delete(ids.webhookEndpointId)],
  listSubscriptions: [(c) => c.subscriptions.list()],
  getSubscription: [(c) => c.subscriptions.get(ids.subscriptionId)],
  updateSubscription: [
    (c) => c.subscriptions.update(ids.subscriptionId, { quantity: 7 }),
    { quantity: 7 },
  ],
  cancelSubscription: [(c) => c.subscriptions.cancel(ids.subscriptionId)],
  createSubscriptionBillingUpdateLink: [
    (c) => c.subscriptions.createBillingUpdateLink(ids.subscriptionId, billing),
    billing,
  ],
  resumeSubscription: [(c) => c.subscriptions.resume(ids.subscriptionId)],
  fastForwardSubscriptionRenewal: [
    (c) =>
      c.testHelpers.fastForwardRenewal(ids.subscriptionId, {
        paymentStatus: "failed",
        failureReason: "card_expired",
      }),
    { paymentStatus: "failed", failureReason: "card_expired" },
  ],
  simulateOrderPayment: [
    (c) => c.testHelpers.simulateOrderPayment(ids.orderId, { paymentStatus: "paid" }),
    { paymentStatus: "paid" },
  ],
};
const operations = Object.entries(spec.paths).flatMap(([path, methods]) =>
  Object.entries(
    methods as Record<string, { operationId: string; responses: Record<string, unknown> }>,
  )
    .filter(([, op]) => op.operationId)
    .map(([method, op]) => ({ path, method, ...op })),
);

describe("production OpenAPI contract", () => {
  it("covers every REST operation and every delivery event", () => {
    expect(Object.keys(cases).sort()).toEqual(operations.map((o) => o.operationId).sort());
    expect([...WEBHOOK_EVENT_NAMES].sort()).toEqual(
      [...spec.components.schemas.WebhookDelivery.properties.eventName.enum].sort(),
    );
  });

  it.each(operations)(
    "$operationId sends the documented request and returns the response",
    async ({ operationId, method, path, responses }) => {
      const [call, body] = cases[operationId]!;
      const status = Number(Object.keys(responses).find((s) => s.startsWith("2")));
      const response =
        status === 204
          ? undefined
          : { id: "result", href: "https://example.com/hosted", type: "text/html" };
      const { client, calls } = makeTestClient([{ status, body: response }]);
      expect(await call(client)).toEqual(response);
      const expectedPath = path.replace(/\{(\w+)\}/g, (_, key: keyof typeof ids) =>
        encodeURIComponent(ids[key]),
      );
      expect(calls).toHaveLength(1);
      expect(calls[0]!.url).toBe(`https://api.example.com/v1${expectedPath}`);
      expect(calls[0]!.method).toBe(method.toUpperCase());
      expect(calls[0]!.body === undefined ? undefined : JSON.parse(calls[0]!.body)).toEqual(body);
    },
  );

  it("supports immediate cancellation and archived catalog pagination", async () => {
    const page = (next: string | null) => ({
      data: [{ id: next ? "first" : "second" }],
      count: 1,
      links: { self: { href: "/" }, prev: null, next: next ? { href: next } : null },
    });
    const { client, calls } = makeTestClient([
      { status: 204 },
      { body: page("/v1/one-off-products?startingAfter=first") },
      { body: page(null) },
    ]);
    expect(await client.subscriptions.cancel("sub_1", { immediately: true })).toBeUndefined();
    expect(calls[0]!.url).toContain("immediately=true");
    const result = [];
    for await (const item of client.oneOffProducts.listAll({ includeArchived: true, limit: 1 }))
      result.push(item.id);
    expect(result).toEqual(["first", "second"]);
    expect(
      calls
        .slice(1)
        .every((c) => c.url.includes("includeArchived=true") && c.url.includes("limit=1")),
    ).toBe(true);
  });
});
