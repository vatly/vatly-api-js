import type { RequestOptions } from "../http.js";
import type { ListParams, PaginatedList } from "../pagination.js";
import type { Checkout, CreateCheckoutRequest } from "../types.js";
import { BaseResource } from "./base.js";

export class CheckoutsResource extends BaseResource {
  list(params: ListParams = {}, opts?: RequestOptions): Promise<PaginatedList<Checkout>> {
    return this.request<PaginatedList<Checkout>>(
      { method: "GET", path: "/checkouts", query: params as Record<string, unknown> },
      opts,
    );
  }

  /** Iterate every checkout across pages. */
  listAll(params: ListParams = {}, opts?: RequestOptions): AsyncIterableIterator<Checkout> {
    return this.paginateAll<Checkout>((p, o) => this.list(p, o), params, opts);
  }

  /**
   * POST /checkouts
   * `products[].trialDays` must be at least 1 and is only allowed on subscription
   * plans; omit it or pass `null` for no trial. A value below 1 is rejected with a
   * `RangeError` before any request is sent.
   */
  create(body: CreateCheckoutRequest, opts?: RequestOptions): Promise<Checkout> {
    const invalid = body.products.find((p) => typeof p.trialDays === "number" && p.trialDays < 1);
    if (invalid) {
      return Promise.reject(
        new RangeError(
          `Vatly: products[].trialDays must be at least 1 (got ${invalid.trialDays}). Omit it or pass null for no trial.`,
        ),
      );
    }
    return this.request<Checkout>({ method: "POST", path: "/checkouts", body }, opts);
  }

  get(checkoutId: string, opts?: RequestOptions): Promise<Checkout> {
    return this.request<Checkout>(
      { method: "GET", path: `/checkouts/${encodeURIComponent(checkoutId)}` },
      opts,
    );
  }
}
