import type { RequestOptions } from "../http.js";
import type { PaginatedList } from "../pagination.js";
import type {
  CreateOneOffProductRequest,
  OneOffProduct,
  OneOffProductListParams,
  UpdateOneOffProductRequest,
} from "../types.js";
import { BaseResource } from "./base.js";

export class OneOffProductsResource extends BaseResource {
  list(
    params: OneOffProductListParams = {},
    opts?: RequestOptions,
  ): Promise<PaginatedList<OneOffProduct>> {
    return this.request<PaginatedList<OneOffProduct>>(
      { method: "GET", path: "/one-off-products", query: params as Record<string, unknown> },
      opts,
    );
  }

  listAll(
    params: OneOffProductListParams = {},
    opts?: RequestOptions,
  ): AsyncIterableIterator<OneOffProduct> {
    return this.paginateAll<OneOffProduct, OneOffProductListParams>(
      (p, o) => this.list(p, o),
      params,
      opts,
    );
  }

  create(body: CreateOneOffProductRequest, opts?: RequestOptions): Promise<OneOffProduct> {
    return this.request({ method: "POST", path: "/one-off-products", body }, opts);
  }

  update(
    oneOffProductId: string,
    body: UpdateOneOffProductRequest,
    opts?: RequestOptions,
  ): Promise<OneOffProduct> {
    return this.request(
      { method: "PATCH", path: `/one-off-products/${encodeURIComponent(oneOffProductId)}`, body },
      opts,
    );
  }

  archive(oneOffProductId: string, opts?: RequestOptions): Promise<void> {
    return this.request(
      {
        method: "POST",
        path: `/one-off-products/${encodeURIComponent(oneOffProductId)}/archive`,
        responseType: "void",
      },
      opts,
    );
  }

  unarchive(oneOffProductId: string, opts?: RequestOptions): Promise<OneOffProduct> {
    return this.request(
      {
        method: "DELETE",
        path: `/one-off-products/${encodeURIComponent(oneOffProductId)}/archive`,
      },
      opts,
    );
  }

  get(oneOffProductId: string, opts?: RequestOptions): Promise<OneOffProduct> {
    return this.request<OneOffProduct>(
      { method: "GET", path: `/one-off-products/${encodeURIComponent(oneOffProductId)}` },
      opts,
    );
  }
}
