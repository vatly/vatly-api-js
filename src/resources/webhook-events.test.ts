import { describe, expect, it } from "vitest";
import { makeTestClient } from "../test-utils.js";

describe("webhookEvents", () => {
  it("get GETs /webhook-events/{id} and returns the persisted event", async () => {
    const { client, calls } = makeTestClient([
      {
        status: 200,
        body: { id: "webhook_event_1", resource: "webhook_event", eventName: "order.paid" },
      },
    ]);

    const event = await client.webhookEvents.get("webhook_event_1");

    expect(calls[0]!.method).toBe("GET");
    expect(calls[0]!.url).toContain("/webhook-events/webhook_event_1");
    expect(event.id).toBe("webhook_event_1");
  });

  it("url-encodes the event id", async () => {
    const { client, calls } = makeTestClient([{ status: 200, body: { id: "a/b" } }]);

    await client.webhookEvents.get("a/b");

    expect(calls[0]!.url).toContain("/webhook-events/a%2Fb");
  });
});
