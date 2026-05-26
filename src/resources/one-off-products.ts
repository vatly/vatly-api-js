import type { RequestOptions } from "../http.js";
import type { ListParams, PaginatedList } from "../pagination.js";
import type { OneOffProduct } from "../types.js";
import { BaseResource } from "./base.js";

export class OneOffProductsResource extends BaseResource {
  list(params: ListParams = {}, opts?: RequestOptions): Promise<PaginatedList<OneOffProduct>> {
    return this.request<PaginatedList<OneOffProduct>>(
      { method: "GET", path: "/one-off-products", query: params as Record<string, unknown> },
      opts,
    );
  }

  listAll(params: ListParams = {}, opts?: RequestOptions): AsyncIterableIterator<OneOffProduct> {
    return this.paginateAll<OneOffProduct>((p, o) => this.list(p, o), params, opts);
  }

  get(oneOffProductId: string, opts?: RequestOptions): Promise<OneOffProduct> {
    return this.request<OneOffProduct>(
      { method: "GET", path: `/one-off-products/${encodeURIComponent(oneOffProductId)}` },
      opts,
    );
  }
}
