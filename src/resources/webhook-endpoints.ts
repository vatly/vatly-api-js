import type { RequestOptions } from "../http.js";
import type { ListParams, PaginatedList } from "../pagination.js";
import type {
  CreateWebhookEndpointRequest,
  UpdateWebhookEndpointRequest,
  WebhookEndpoint,
} from "../types.js";
import { BaseResource } from "./base.js";

export class WebhookEndpointsResource extends BaseResource {
  list(params: ListParams = {}, opts?: RequestOptions): Promise<PaginatedList<WebhookEndpoint>> {
    return this.request(
      { method: "GET", path: "/webhook-endpoints", query: params as Record<string, unknown> },
      opts,
    );
  }

  listAll(params: ListParams = {}, opts?: RequestOptions): AsyncIterableIterator<WebhookEndpoint> {
    return this.paginateAll<WebhookEndpoint>((p, o) => this.list(p, o), params, opts);
  }

  get(webhookEndpointId: string, opts?: RequestOptions): Promise<WebhookEndpoint> {
    return this.request(
      { method: "GET", path: `/webhook-endpoints/${encodeURIComponent(webhookEndpointId)}` },
      opts,
    );
  }

  create(body: CreateWebhookEndpointRequest, opts?: RequestOptions): Promise<WebhookEndpoint> {
    return this.request({ method: "POST", path: "/webhook-endpoints", body }, opts);
  }

  update(
    webhookEndpointId: string,
    body: UpdateWebhookEndpointRequest,
    opts?: RequestOptions,
  ): Promise<WebhookEndpoint> {
    return this.request(
      {
        method: "PATCH",
        path: `/webhook-endpoints/${encodeURIComponent(webhookEndpointId)}`,
        body,
      },
      opts,
    );
  }

  delete(webhookEndpointId: string, opts?: RequestOptions): Promise<void> {
    return this.request(
      { method: "DELETE", path: `/webhook-endpoints/${encodeURIComponent(webhookEndpointId)}` },
      opts,
    );
  }
}
