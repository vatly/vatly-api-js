import type { RequestOptions } from "../http.js";
import type { ListParams, PaginatedList } from "../pagination.js";
import type {
  CancelSubscriptionParams,
  Subscription,
  SubscriptionBillingUpdateLink,
  UpdateSubscriptionBillingRequest,
  UpdateSubscriptionRequest,
} from "../types.js";
import { BaseResource } from "./base.js";

export class SubscriptionsResource extends BaseResource {
  list(params: ListParams = {}, opts?: RequestOptions): Promise<PaginatedList<Subscription>> {
    return this.request<PaginatedList<Subscription>>(
      { method: "GET", path: "/subscriptions", query: params as Record<string, unknown> },
      opts,
    );
  }

  listAll(params: ListParams = {}, opts?: RequestOptions): AsyncIterableIterator<Subscription> {
    return this.paginateAll<Subscription>((p, o) => this.list(p, o), params, opts);
  }

  get(subscriptionId: string, opts?: RequestOptions): Promise<Subscription> {
    return this.request<Subscription>(
      { method: "GET", path: `/subscriptions/${encodeURIComponent(subscriptionId)}` },
      opts,
    );
  }

  /**
   * PATCH /subscriptions/{id}
   * Update plan, price or quantity. At least one of these is required by the
   * server; trialUntil may accompany it but cannot be sent alone.
   */
  update(
    subscriptionId: string,
    body: UpdateSubscriptionRequest,
    opts?: RequestOptions,
  ): Promise<Subscription> {
    return this.request<Subscription>(
      {
        method: "PATCH",
        path: `/subscriptions/${encodeURIComponent(subscriptionId)}`,
        body,
      },
      opts,
    );
  }

  cancel(subscriptionId: string, opts?: RequestOptions & CancelSubscriptionParams): Promise<void> {
    return this.request<void>(
      {
        method: "DELETE",
        path: `/subscriptions/${encodeURIComponent(subscriptionId)}`,
        query: { immediately: opts?.immediately },
      },
      opts,
    );
  }

  /**
   * POST /subscriptions/{id}/resume
   * Resumes a subscription that was canceled with a grace period, while its
   * `status` is still `on_grace_period`. The refreshed subscription is returned.
   */
  resume(subscriptionId: string, opts?: RequestOptions): Promise<Subscription> {
    return this.request<Subscription>(
      {
        method: "POST",
        path: `/subscriptions/${encodeURIComponent(subscriptionId)}/resume`,
      },
      opts,
    );
  }

  /**
   * POST /subscriptions/{id}/billing-update-link
   * Generates a signed, hosted URL the customer can use to update their billing
   * details (billing address, VAT number, company name).
   */
  createBillingUpdateLink(
    subscriptionId: string,
    body: UpdateSubscriptionBillingRequest,
    opts?: RequestOptions,
  ): Promise<SubscriptionBillingUpdateLink> {
    return this.request<SubscriptionBillingUpdateLink>(
      {
        method: "POST",
        path: `/subscriptions/${encodeURIComponent(subscriptionId)}/billing-update-link`,
        body,
      },
      opts,
    );
  }

  /** @deprecated use createBillingUpdateLink */
  updateBilling(
    subscriptionId: string,
    body: UpdateSubscriptionBillingRequest,
    opts?: RequestOptions,
  ): Promise<SubscriptionBillingUpdateLink> {
    return this.createBillingUpdateLink(subscriptionId, body, opts);
  }
}
