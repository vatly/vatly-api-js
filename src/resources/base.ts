import type { ResolvedConfig } from "../config.js";
import { type RawRequest, type RequestOptions, performRequest } from "../http.js";
import { type ListParams, type PaginatedList, paginate } from "../pagination.js";

/**
 * Base class for resource namespaces. Resources should be thin wrappers around
 * `request()` that supply paths, methods, and types.
 */
export abstract class BaseResource {
  constructor(protected readonly config: ResolvedConfig) {}

  protected request<T>(req: RawRequest, options: RequestOptions = {}): Promise<T> {
    return performRequest<T>(req, options, this.config);
  }

  /** Build an async-iterable that walks all pages of a list endpoint. */
  protected paginateAll<T, P extends ListParams = ListParams>(
    list: (params: P, opts?: RequestOptions) => Promise<PaginatedList<T>>,
    params: P = {} as P,
    opts?: RequestOptions,
  ): AsyncIterableIterator<T> {
    return paginate<T, P>((p) => list(p, opts), params);
  }
}
