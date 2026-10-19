import type { RequestOptions } from "../http.js";
import type { ListParams, PaginatedList } from "../pagination.js";
import type {
  CreateCustomerRequest,
  CreatePortalSessionRequest,
  Customer,
  PortalSession,
  Subscription,
  UpdateCustomerRequest,
} from "../types.js";
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

  /**
   * PATCH /customers/{id}
   * Updates `name` and/or `email`. Billing-address fields are ignored here —
   * amend those through the hosted billing-update flow instead.
   */
  update(
    customerId: string,
    body: UpdateCustomerRequest,
    opts?: RequestOptions,
  ): Promise<Customer> {
    return this.request<Customer>(
      {
        method: "PATCH",
        path: `/customers/${encodeURIComponent(customerId)}`,
        body,
      },
      opts,
    );
  }

  /**
   * POST /customers/{id}/portal-sessions
   * Creates a short-lived, single-use URL into the hosted customer portal.
   * Redirect the customer's browser to the returned `url` — do not store it
   * as a long-lived account link.
   */
  createPortalSession(
    customerId: string,
    body: CreatePortalSessionRequest = {},
    opts?: RequestOptions,
  ): Promise<PortalSession> {
    return this.request<PortalSession>(
      {
        method: "POST",
        path: `/customers/${encodeURIComponent(customerId)}/portal-sessions`,
        body,
      },
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
