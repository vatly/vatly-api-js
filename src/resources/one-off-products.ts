import type { RequestOptions } from "../http.js";
import type { ListParams, PaginatedList } from "../pagination.js";
import type {
  CreateOneOffProductRequest,
  OneOffProduct,
  UpdateOneOffProductRequest,
} from "../types.js";
import { BaseResource } from "./base.js";

export interface ListOneOffProductsParams extends ListParams {
  includeArchived?: boolean;
}

export class OneOffProductsResource extends BaseResource {
  list(
    params: ListOneOffProductsParams = {},
    opts?: RequestOptions,
  ): Promise<PaginatedList<OneOffProduct>> {
    return this.request<PaginatedList<OneOffProduct>>(
      { method: "GET", path: "/one-off-products", query: params as Record<string, unknown> },
      opts,
    );
  }

  listAll(
    params: ListOneOffProductsParams = {},
    opts?: RequestOptions,
  ): AsyncIterableIterator<OneOffProduct> {
    return this.paginateAll<OneOffProduct, ListOneOffProductsParams>(
      (p, o) => this.list(p, o),
      params,
      opts,
    );
  }

  get(oneOffProductId: string, opts?: RequestOptions): Promise<OneOffProduct> {
    return this.request<OneOffProduct>(
      { method: "GET", path: `/one-off-products/${encodeURIComponent(oneOffProductId)}` },
      opts,
    );
  }

  /**
   * POST /one-off-products
   * Products created with a `live_` token start in `pending` status and are
   * reviewed by Vatly before they can be sold. Products created with a `test_`
   * token are auto-approved.
   */
  create(body: CreateOneOffProductRequest, opts?: RequestOptions): Promise<OneOffProduct> {
    return this.request<OneOffProduct>({ method: "POST", path: "/one-off-products", body }, opts);
  }

  /**
   * PATCH /one-off-products/{id}
   * Submits an update. In live mode the update enters review; in test mode it's
   * auto-approved. See the API docs for the "complete set of changes" semantics.
   */
  update(
    oneOffProductId: string,
    body: UpdateOneOffProductRequest,
    opts?: RequestOptions,
  ): Promise<OneOffProduct> {
    return this.request<OneOffProduct>(
      {
        method: "PATCH",
        path: `/one-off-products/${encodeURIComponent(oneOffProductId)}`,
        body,
      },
      opts,
    );
  }

  /**
   * POST /one-off-products/{id}/archive
   * Takes the product out of the sellable catalogue. Returns `204 No Content`.
   */
  archive(oneOffProductId: string, opts?: RequestOptions): Promise<void> {
    return this.request<void>(
      {
        method: "POST",
        path: `/one-off-products/${encodeURIComponent(oneOffProductId)}/archive`,
      },
      opts,
    );
  }

  /**
   * DELETE /one-off-products/{id}/archive
   * Puts an archived product back on sale.
   */
  unarchive(oneOffProductId: string, opts?: RequestOptions): Promise<OneOffProduct> {
    return this.request<OneOffProduct>(
      {
        method: "DELETE",
        path: `/one-off-products/${encodeURIComponent(oneOffProductId)}/archive`,
      },
      opts,
    );
  }
}
