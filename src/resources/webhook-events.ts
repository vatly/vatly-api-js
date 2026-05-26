import type { RequestOptions } from "../http.js";
import type { WebhookEvent } from "../types.js";
import { BaseResource } from "./base.js";

export class WebhookEventsResource extends BaseResource {
  get(eventId: string, opts?: RequestOptions): Promise<WebhookEvent> {
    return this.request<WebhookEvent>(
      { method: "GET", path: `/webhook-events/${encodeURIComponent(eventId)}` },
      opts,
    );
  }
}
