import type { RequestOptions } from "../http.js";
import type { PaginatedList, ListParams } from "../pagination.js";
import type { Chargeback } from "../types.js";
import { BaseResource } from "./base.js";

export class ChargebacksResource extends BaseResource {
  list(params: ListParams = {}, opts?: RequestOptions): Promise<PaginatedList<Chargeback>> {
    return this.request<PaginatedList<Chargeback>>(
      { method: "GET", path: "/chargebacks", query: params as Record<string, unknown> },
      opts,
    );
  }

  listAll(params: ListParams = {}, opts?: RequestOptions): AsyncIterableIterator<Chargeback> {
    return this.paginateAll<Chargeback>((p, o) => this.list(p, o), params, opts);
  }

  get(chargebackId: string, opts?: RequestOptions): Promise<Chargeback> {
    return this.request<Chargeback>(
      { method: "GET", path: `/chargebacks/${encodeURIComponent(chargebackId)}` },
      opts,
    );
  }
}
