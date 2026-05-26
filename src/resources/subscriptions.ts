import type { RequestOptions } from "../http.js";
import type { ListParams, PaginatedList } from "../pagination.js";
import type {
  Subscription,
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
   * Update plan, quantity, or trial. The spec has an internal inconsistency around
   * whether `trialUntil` may be sent alone — the SDK passes the body through unchanged
   * and lets the server validate. See README "Known spec ambiguities".
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

  cancel(subscriptionId: string, opts?: RequestOptions): Promise<Subscription> {
    return this.request<Subscription>(
      {
        method: "DELETE",
        path: `/subscriptions/${encodeURIComponent(subscriptionId)}`,
      },
      opts,
    );
  }

  /** PATCH /subscriptions/{id}/update-billing — note: PATCH, not POST. */
  updateBilling(
    subscriptionId: string,
    body: UpdateSubscriptionBillingRequest,
    opts?: RequestOptions,
  ): Promise<Subscription> {
    return this.request<Subscription>(
      {
        method: "PATCH",
        path: `/subscriptions/${encodeURIComponent(subscriptionId)}/update-billing`,
        body,
      },
      opts,
    );
  }
}
