import type { RequestOptions } from "../http.js";
import type { PaginatedList } from "../pagination.js";
import type {
  CreateSubscriptionPlanRequest,
  SubscriptionPlan,
  SubscriptionPlanListParams,
  UpdateSubscriptionPlanRequest,
} from "../types.js";
import { BaseResource } from "./base.js";

export class SubscriptionPlansResource extends BaseResource {
  list(
    params: SubscriptionPlanListParams = {},
    opts?: RequestOptions,
  ): Promise<PaginatedList<SubscriptionPlan>> {
    return this.request<PaginatedList<SubscriptionPlan>>(
      { method: "GET", path: "/subscription-plans", query: params as Record<string, unknown> },
      opts,
    );
  }

  listAll(
    params: SubscriptionPlanListParams = {},
    opts?: RequestOptions,
  ): AsyncIterableIterator<SubscriptionPlan> {
    return this.paginateAll<SubscriptionPlan, SubscriptionPlanListParams>(
      (p, o) => this.list(p, o),
      params,
      opts,
    );
  }

  create(body: CreateSubscriptionPlanRequest, opts?: RequestOptions): Promise<SubscriptionPlan> {
    return this.request({ method: "POST", path: "/subscription-plans", body }, opts);
  }

  update(
    subscriptionPlanId: string,
    body: UpdateSubscriptionPlanRequest,
    opts?: RequestOptions,
  ): Promise<SubscriptionPlan> {
    return this.request(
      {
        method: "PATCH",
        path: `/subscription-plans/${encodeURIComponent(subscriptionPlanId)}`,
        body,
      },
      opts,
    );
  }

  archive(subscriptionPlanId: string, opts?: RequestOptions): Promise<void> {
    return this.request(
      {
        method: "POST",
        responseType: "void",
        path: `/subscription-plans/${encodeURIComponent(subscriptionPlanId)}/archive`,
      },
      opts,
    );
  }

  unarchive(subscriptionPlanId: string, opts?: RequestOptions): Promise<SubscriptionPlan> {
    return this.request(
      {
        method: "DELETE",
        path: `/subscription-plans/${encodeURIComponent(subscriptionPlanId)}/archive`,
      },
      opts,
    );
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
