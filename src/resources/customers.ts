import type { RequestOptions } from "../http.js";
import type { ListParams, PaginatedList } from "../pagination.js";
import type { CreateCustomerRequest, Customer, Subscription } from "../types.js";
import { BaseResource } from "./base.js";

export class CustomersResource extends BaseResource {
  list(params: ListParams = {}, opts?: RequestOptions): Promise<PaginatedList<Customer>> {
    return this.request<PaginatedList<Customer>>(
      { method: "GET", path: "/customers", query: params as Record<string, unknown> },
      opts,
    );
  }

  listAll(params: ListParams = {}, opts?: RequestOptions): AsyncIterableIterator<Customer> {
    return this.paginateAll<Customer>((p, o) => this.list(p, o), params, opts);
  }

  create(body: CreateCustomerRequest, opts?: RequestOptions): Promise<Customer> {
    return this.request<Customer>({ method: "POST", path: "/customers", body }, opts);
  }

  get(customerId: string, opts?: RequestOptions): Promise<Customer> {
    return this.request<Customer>(
      { method: "GET", path: `/customers/${encodeURIComponent(customerId)}` },
      opts,
    );
  }

  listSubscriptions(
    customerId: string,
    params: ListParams = {},
    opts?: RequestOptions,
  ): Promise<PaginatedList<Subscription>> {
    return this.request<PaginatedList<Subscription>>(
      {
        method: "GET",
        path: `/customers/${encodeURIComponent(customerId)}/subscriptions`,
        query: params as Record<string, unknown>,
      },
      opts,
    );
  }

  listAllSubscriptions(
    customerId: string,
    params: ListParams = {},
    opts?: RequestOptions,
  ): AsyncIterableIterator<Subscription> {
    return this.paginateAll<Subscription>(
      (p, o) => this.listSubscriptions(customerId, p, o),
      params,
      opts,
    );
  }

  getSubscription(
    customerId: string,
    subscriptionId: string,
    opts?: RequestOptions,
  ): Promise<Subscription> {
    return this.request<Subscription>(
      {
        method: "GET",
        path: `/customers/${encodeURIComponent(customerId)}/subscriptions/${encodeURIComponent(
          subscriptionId,
        )}`,
      },
      opts,
    );
  }
}
