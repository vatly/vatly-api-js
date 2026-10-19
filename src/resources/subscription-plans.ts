import type { RequestOptions } from "../http.js";
import type { ListParams, PaginatedList } from "../pagination.js";
import type {
  CreateSubscriptionPlanRequest,
  SubscriptionPlan,
  UpdateSubscriptionPlanRequest,
} from "../types.js";
import { BaseResource } from "./base.js";

/**
 * Params for listing subscription plans. Mirrors the spec's `includeArchived`
 * knob — by default archived plans are excluded; pass `true` to include them.
 */
export interface ListSubscriptionPlansParams extends ListParams {
  includeArchived?: boolean;
}

export class SubscriptionPlansResource extends BaseResource {
  list(
    params: ListSubscriptionPlansParams = {},
    opts?: RequestOptions,
  ): Promise<PaginatedList<SubscriptionPlan>> {
    return this.request<PaginatedList<SubscriptionPlan>>(
      { method: "GET", path: "/subscription-plans", query: params as Record<string, unknown> },
      opts,
    );
  }

  listAll(
    params: ListSubscriptionPlansParams = {},
    opts?: RequestOptions,
  ): AsyncIterableIterator<SubscriptionPlan> {
    return this.paginateAll<SubscriptionPlan, ListSubscriptionPlansParams>(
      (p, o) => this.list(p, o),
      params,
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

  /**
   * POST /subscription-plans
   * Plans created with a `live_` token start in `pending` status and must be
   * approved by Vatly before they're usable in checkouts. Plans created with a
   * `test_` token are auto-approved.
   */
  create(body: CreateSubscriptionPlanRequest, opts?: RequestOptions): Promise<SubscriptionPlan> {
    return this.request<SubscriptionPlan>(
      { method: "POST", path: "/subscription-plans", body },
      opts,
    );
  }

  /**
   * PATCH /subscription-plans/{id}
   * Submits an update. In live mode the change is held as a pending update and
   * reviewed by Vatly before it takes effect; in test mode it's auto-approved.
   * Sending the same values as the current live plan is a no-op; a request that
   * nets to no change clears any pending update.
   */
  update(
    subscriptionPlanId: string,
    body: UpdateSubscriptionPlanRequest,
    opts?: RequestOptions,
  ): Promise<SubscriptionPlan> {
    return this.request<SubscriptionPlan>(
      {
        method: "PATCH",
        path: `/subscription-plans/${encodeURIComponent(subscriptionPlanId)}`,
        body,
      },
      opts,
    );
  }

  /**
   * POST /subscription-plans/{id}/archive
   * Closes the plan to new business. Subscribers already on the plan are not
   * affected. Returns `204 No Content`; the SDK resolves to `undefined`.
   */
  archive(subscriptionPlanId: string, opts?: RequestOptions): Promise<void> {
    return this.request<void>(
      {
        method: "POST",
        path: `/subscription-plans/${encodeURIComponent(subscriptionPlanId)}/archive`,
      },
      opts,
    );
  }

  /**
   * DELETE /subscription-plans/{id}/archive
   * Re-opens an archived plan. Returns the refreshed plan.
   */
  unarchive(subscriptionPlanId: string, opts?: RequestOptions): Promise<SubscriptionPlan> {
    return this.request<SubscriptionPlan>(
      {
        method: "DELETE",
        path: `/subscription-plans/${encodeURIComponent(subscriptionPlanId)}/archive`,
      },
      opts,
    );
  }
}
