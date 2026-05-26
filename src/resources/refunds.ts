import type { RequestOptions } from "../http.js";
import type { ListParams, PaginatedList } from "../pagination.js";
import type { Refund } from "../types.js";
import { BaseResource } from "./base.js";

/** Top-level /refunds endpoints. For order-scoped refunds, use `orders.createRefund` etc. */
export class RefundsResource extends BaseResource {
  list(params: ListParams = {}, opts?: RequestOptions): Promise<PaginatedList<Refund>> {
    return this.request<PaginatedList<Refund>>(
      { method: "GET", path: "/refunds", query: params as Record<string, unknown> },
      opts,
    );
  }

  listAll(params: ListParams = {}, opts?: RequestOptions): AsyncIterableIterator<Refund> {
    return this.paginateAll<Refund>((p, o) => this.list(p, o), params, opts);
  }

  get(refundId: string, opts?: RequestOptions): Promise<Refund> {
    return this.request<Refund>(
      { method: "GET", path: `/refunds/${encodeURIComponent(refundId)}` },
      opts,
    );
  }
}
