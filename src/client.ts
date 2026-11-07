import { type ResolvedConfig, type VatlyClientOptions, resolveConfig } from "./config.js";
import { ChargebacksResource } from "./resources/chargebacks.js";
import { CheckoutsResource } from "./resources/checkouts.js";
import { CustomersResource } from "./resources/customers.js";
import { OneOffProductsResource } from "./resources/one-off-products.js";
import { OrdersResource } from "./resources/orders.js";
import { RefundsResource } from "./resources/refunds.js";
import { SubscriptionPlansResource } from "./resources/subscription-plans.js";
import { SubscriptionsResource } from "./resources/subscriptions.js";
import { TestHelpersResource } from "./resources/test-helpers.js";
import { WebhookEndpointsResource } from "./resources/webhook-endpoints.js";
import { WebhookEventsResource } from "./resources/webhook-events.js";

export class VatlyClient {
  readonly checkouts: CheckoutsResource;
  readonly customers: CustomersResource;
  readonly oneOffProducts: OneOffProductsResource;
  readonly subscriptionPlans: SubscriptionPlansResource;
  readonly orders: OrdersResource;
  readonly refunds: RefundsResource;
  readonly chargebacks: ChargebacksResource;
  readonly subscriptions: SubscriptionsResource;
  readonly webhookEndpoints: WebhookEndpointsResource;
  readonly webhookEvents: WebhookEventsResource;
  readonly testHelpers: TestHelpersResource;

  private readonly config: ResolvedConfig;

  constructor(options: VatlyClientOptions = {}) {
    this.config = resolveConfig(options);

    this.checkouts = new CheckoutsResource(this.config);
    this.customers = new CustomersResource(this.config);
    this.oneOffProducts = new OneOffProductsResource(this.config);
    this.subscriptionPlans = new SubscriptionPlansResource(this.config);
    this.orders = new OrdersResource(this.config);
    this.refunds = new RefundsResource(this.config);
    this.chargebacks = new ChargebacksResource(this.config);
    this.subscriptions = new SubscriptionsResource(this.config);
    this.webhookEndpoints = new WebhookEndpointsResource(this.config);
    this.webhookEvents = new WebhookEventsResource(this.config);
    this.testHelpers = new TestHelpersResource(this.config);
  }

  /** Returns `"live"` or `"test"` based on the API key prefix. */
  get mode(): "live" | "test" {
    return this.config.mode;
  }

  /** Effective base URL after server/baseUrl resolution. */
  get baseUrl(): string {
    return this.config.baseUrl;
  }
}
