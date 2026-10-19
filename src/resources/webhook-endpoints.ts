import type { RequestOptions } from "../http.js";
import type { ListParams, PaginatedList } from "../pagination.js";
import type {
  CreateWebhookEndpointRequest,
  UpdateWebhookEndpointRequest,
  WebhookEndpoint,
} from "../types.js";
import { BaseResource } from "./base.js";

/**
 * CRUD for the managed `/webhook-endpoints` collection. The signing `secret`
 * is write-only on the server side — it's accepted on create/update and
 * never returned in any response. Keep the value you send: it's what you
 * verify incoming webhook signatures with.
 */
export class WebhookEndpointsResource extends BaseResource {
  list(params: ListParams = {}, opts?: RequestOptions): Promise<PaginatedList<WebhookEndpoint>> {
    return this.request<PaginatedList<WebhookEndpoint>>(
      { method: "GET", path: "/webhook-endpoints", query: params as Record<string, unknown> },
      opts,
    );
  }

  listAll(params: ListParams = {}, opts?: RequestOptions): AsyncIterableIterator<WebhookEndpoint> {
    return this.paginateAll<WebhookEndpoint>((p, o) => this.list(p, o), params, opts);
  }

  get(webhookEndpointId: string, opts?: RequestOptions): Promise<WebhookEndpoint> {
    return this.request<WebhookEndpoint>(
      {
        method: "GET",
        path: `/webhook-endpoints/${encodeURIComponent(webhookEndpointId)}`,
      },
      opts,
    );
  }

  /**
   * POST /webhook-endpoints
   * Registers a new endpoint. Vatly sends a `webhook.setup` verification ping
   * to the `url` and rejects the request if that fails or the URL's SSL
   * certificate is invalid.
   */
  create(body: CreateWebhookEndpointRequest, opts?: RequestOptions): Promise<WebhookEndpoint> {
    return this.request<WebhookEndpoint>(
      { method: "POST", path: "/webhook-endpoints", body },
      opts,
    );
  }

  /**
   * PATCH /webhook-endpoints/{id}
   * Repoint the URL, rotate the secret, and/or replace the `enabledEvents`
   * subscription set. Omitting `enabledEvents` preserves the current set;
   * sending `[]` makes the endpoint dormant.
   */
  update(
    webhookEndpointId: string,
    body: UpdateWebhookEndpointRequest,
    opts?: RequestOptions,
  ): Promise<WebhookEndpoint> {
    return this.request<WebhookEndpoint>(
      {
        method: "PATCH",
        path: `/webhook-endpoints/${encodeURIComponent(webhookEndpointId)}`,
        body,
      },
      opts,
    );
  }

  /** DELETE /webhook-endpoints/{id} — stops deliveries immediately. */
  delete(webhookEndpointId: string, opts?: RequestOptions): Promise<void> {
    return this.request<void>(
      {
        method: "DELETE",
        path: `/webhook-endpoints/${encodeURIComponent(webhookEndpointId)}`,
      },
      opts,
    );
  }
}
