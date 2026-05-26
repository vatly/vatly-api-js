import type { RequestOptions } from "../http.js";
import type { ListParams, PaginatedList } from "../pagination.js";
import type {
  AddressUpdateLink,
  Chargeback,
  CreateFullRefundRequest,
  CreateRefundRequest,
  Order,
  Refund,
} from "../types.js";
import { BaseResource } from "./base.js";

export class OrdersResource extends BaseResource {
  list(params: ListParams = {}, opts?: RequestOptions): Promise<PaginatedList<Order>> {
    return this.request<PaginatedList<Order>>(
      { method: "GET", path: "/orders", query: params as Record<string, unknown> },
      opts,
    );
  }

  listAll(params: ListParams = {}, opts?: RequestOptions): AsyncIterableIterator<Order> {
    return this.paginateAll<Order>((p, o) => this.list(p, o), params, opts);
  }

  get(orderId: string, opts?: RequestOptions): Promise<Order> {
    return this.request<Order>(
      { method: "GET", path: `/orders/${encodeURIComponent(orderId)}` },
      opts,
    );
  }

  /**
   * POST /orders/{orderId}/request-address-update-link
   * Returns a hosted link the customer can use to update their billing address.
   */
  requestAddressUpdateLink(orderId: string, opts?: RequestOptions): Promise<AddressUpdateLink> {
    return this.request<AddressUpdateLink>(
      {
        method: "POST",
        path: `/orders/${encodeURIComponent(orderId)}/request-address-update-link`,
      },
      opts,
    );
  }

  // --- Refunds nested under an order ---

  listRefunds(
    orderId: string,
    params: ListParams = {},
    opts?: RequestOptions,
  ): Promise<PaginatedList<Refund>> {
    return this.request<PaginatedList<Refund>>(
      {
        method: "GET",
        path: `/orders/${encodeURIComponent(orderId)}/refunds`,
        query: params as Record<string, unknown>,
      },
      opts,
    );
  }

  listAllRefunds(
    orderId: string,
    params: ListParams = {},
    opts?: RequestOptions,
  ): AsyncIterableIterator<Refund> {
    return this.paginateAll<Refund>((p, o) => this.listRefunds(orderId, p, o), params, opts);
  }

  createRefund(orderId: string, body: CreateRefundRequest, opts?: RequestOptions): Promise<Refund> {
    return this.request<Refund>(
      {
        method: "POST",
        path: `/orders/${encodeURIComponent(orderId)}/refunds`,
        body,
      },
      opts,
    );
  }

  createFullRefund(
    orderId: string,
    body: CreateFullRefundRequest = {},
    opts?: RequestOptions,
  ): Promise<Refund> {
    return this.request<Refund>(
      {
        method: "POST",
        path: `/orders/${encodeURIComponent(orderId)}/refunds/full`,
        body,
      },
      opts,
    );
  }

  getRefund(orderId: string, refundId: string, opts?: RequestOptions): Promise<Refund> {
    return this.request<Refund>(
      {
        method: "GET",
        path: `/orders/${encodeURIComponent(orderId)}/refunds/${encodeURIComponent(refundId)}`,
      },
      opts,
    );
  }

  cancelRefund(orderId: string, refundId: string, opts?: RequestOptions): Promise<void> {
    return this.request<void>(
      {
        method: "DELETE",
        path: `/orders/${encodeURIComponent(orderId)}/refunds/${encodeURIComponent(refundId)}`,
      },
      opts,
    );
  }

  // --- Chargebacks nested under an order ---

  listChargebacks(
    orderId: string,
    params: ListParams = {},
    opts?: RequestOptions,
  ): Promise<PaginatedList<Chargeback>> {
    return this.request<PaginatedList<Chargeback>>(
      {
        method: "GET",
        path: `/orders/${encodeURIComponent(orderId)}/chargebacks`,
        query: params as Record<string, unknown>,
      },
      opts,
    );
  }

  getChargeback(orderId: string, chargebackId: string, opts?: RequestOptions): Promise<Chargeback> {
    return this.request<Chargeback>(
      {
        method: "GET",
        path: `/orders/${encodeURIComponent(orderId)}/chargebacks/${encodeURIComponent(
          chargebackId,
        )}`,
      },
      opts,
    );
  }
}
