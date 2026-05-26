import type { RequestOptions } from "../http.js";
import type { ListParams, PaginatedList } from "../pagination.js";
import type { SubscriptionPlan } from "../types.js";
import { BaseResource } from "./base.js";

export class SubscriptionPlansResource extends BaseResource {
  list(params: ListParams = {}, opts?: RequestOptions): Promise<PaginatedList<SubscriptionPlan>> {
    return this.request<PaginatedList<SubscriptionPlan>>(
      { method: "GET", path: "/subscription-plans", query: params as Record<string, unknown> },
      opts,
    );
  }

  listAll(params: ListParams = {}, opts?: RequestOptions): AsyncIterableIterator<SubscriptionPlan> {
    return this.paginateAll<SubscriptionPlan>((p, o) => this.list(p, o), params, opts);
  }

  get(subscriptionPlanId: string, opts?: RequestOptions): Promise<SubscriptionPlan> {
    return this.request<SubscriptionPlan>(
      {
        method: "GET",
        path: `/subscription-plans/${encodeURIComponent(subscriptionPlanId)}`,
      },
      opts,
    );
  }
}
