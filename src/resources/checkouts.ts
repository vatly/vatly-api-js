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

  create(body: CreateCheckoutRequest, opts?: RequestOptions): Promise<Checkout> {
    return this.request<Checkout>({ method: "POST", path: "/checkouts", body }, opts);
  }

  get(checkoutId: string, opts?: RequestOptions): Promise<Checkout> {
    return this.request<Checkout>(
      { method: "GET", path: `/checkouts/${encodeURIComponent(checkoutId)}` },
      opts,
    );
  }
}
