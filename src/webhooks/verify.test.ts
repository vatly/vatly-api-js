import { describe, expect, it } from "vitest";
import {
  VATLY_EVENT_ID_HEADER,
  VATLY_SIGNATURE_HEADER,
  computeSignatureV1,
  constructEvent,
  constructEventFromRequest,
  isValidWebhookSignature,
  parseSignatureHeader,
  verifyWebhookSignature,
} from "./verify.js";
import { VatlyInvalidSignatureError } from "../errors.js";

const SECRET = "whsec_test";

// A representative WebhookEvent payload (matches the spec shape).
const rawBody = JSON.stringify({
  id: "webhook_event_x",
  resource: "webhook_event",
  eventName: "order.paid",
  entityType: "order",
  entityId: "order_1",
  object: {},
  links: {
    self: {
      href: "https://api.example.com/v1/webhook-events/webhook_event_x",
      type: "application/json",
    },
  },
});

const FROZEN_T = 1_700_000_000;
const FROZEN_NOW = () => FROZEN_T;

async function signedHeader(t: number, body: string, secret = SECRET): Promise<string> {
  const v1 = await computeSignatureV1(body, secret, t);
  return `t=${t},v1=${v1}`;
}

describe("webhook verify — v1 timestamped signature", () => {
  describe("protocol-locked vector (matches vatlify DefaultSignerTest)", () => {
    it("computeSignatureV1 matches the byte-for-byte locked vector", async () => {
      const sig = await computeSignatureV1('{"foo":"bar"}', "my_secret_key", 1_700_000_000);
      expect(sig).toBe(
        "f5a64398fd049d1507a2654439f257e7549fcff6ffa9bbc355c7f1ebaefb6925",
      );
    });

    it("swapping the timestamp invalidates the signature", async () => {
      const a = await computeSignatureV1('{"foo":"bar"}', "my_secret_key", 1_700_000_000);
      const b = await computeSignatureV1('{"foo":"bar"}', "my_secret_key", 1_700_000_001);
      expect(a).not.toBe(b);
    });

    it("a single byte change in the body changes the signature", async () => {
      const a = await computeSignatureV1('{"foo":"bar"}', "my_secret_key", 1_700_000_000);
      const b = await computeSignatureV1('{"foo": "bar"}', "my_secret_key", 1_700_000_000);
      expect(a).not.toBe(b);
    });
  });

  describe("parseSignatureHeader", () => {
    it("parses t and v1", () => {
      const p = parseSignatureHeader("t=1700000000,v1=abc");
      expect(p.t).toBe(1_700_000_000);
      expect(p.versions.v1).toBe("abc");
    });

    it("is order-agnostic and lenient on whitespace", () => {
      const p = parseSignatureHeader("  v1=abc ,  t=1700000000  ");
      expect(p.t).toBe(1_700_000_000);
      expect(p.versions.v1).toBe("abc");
    });

    it("collects multiple version slots", () => {
      const p = parseSignatureHeader("t=1,v1=aaa,v2=bbb,v9=ccc");
      expect(p.versions).toEqual({ v1: "aaa", v2: "bbb", v9: "ccc" });
    });

    it("ignores unknown / malformed pairs", () => {
      const p = parseSignatureHeader("t=1,v1=abc,garbage,=novalue,nokey=,v=missingdigit");
      expect(p.t).toBe(1);
      expect(p.versions.v1).toBe("abc");
      // `v=` is not vN, so it is NOT a recognized version slot
      expect(p.versions.v).toBeUndefined();
    });

    it("rejects malformed t values", () => {
      expect(parseSignatureHeader("t=not_a_number,v1=abc").t).toBeUndefined();
      expect(parseSignatureHeader("t=-5,v1=abc").t).toBeUndefined();
    });
  });

  describe("verifyWebhookSignature", () => {
    it("accepts a fresh, well-formed signature", async () => {
      const header = await signedHeader(FROZEN_T, rawBody);
      await expect(
        verifyWebhookSignature(rawBody, header, SECRET, { now: FROZEN_NOW }),
      ).resolves.toBeUndefined();
    });

    it("rejects when t is missing", async () => {
      const header = "v1=" + (await computeSignatureV1(rawBody, SECRET, FROZEN_T));
      await expect(
        verifyWebhookSignature(rawBody, header, SECRET, { now: FROZEN_NOW }),
      ).rejects.toThrow(/missing or invalid `t`/);
    });

    it("rejects when no recognized version slot is present", async () => {
      const header = `t=${FROZEN_T},v9=deadbeef`;
      await expect(
        verifyWebhookSignature(rawBody, header, SECRET, { now: FROZEN_NOW }),
      ).rejects.toThrow(/no recognized version/);
    });

    it("rejects when signature header is missing", async () => {
      await expect(verifyWebhookSignature(rawBody, undefined, SECRET)).rejects.toBeInstanceOf(
        VatlyInvalidSignatureError,
      );
      await expect(verifyWebhookSignature(rawBody, "", SECRET)).rejects.toBeInstanceOf(
        VatlyInvalidSignatureError,
      );
    });

    it("rejects on tampered body", async () => {
      const header = await signedHeader(FROZEN_T, rawBody);
      await expect(
        verifyWebhookSignature(rawBody + " ", header, SECRET, { now: FROZEN_NOW }),
      ).rejects.toThrow(/signature mismatch/i);
    });

    it("rejects on wrong secret", async () => {
      const header = await signedHeader(FROZEN_T, rawBody, "different_secret");
      await expect(
        verifyWebhookSignature(rawBody, header, SECRET, { now: FROZEN_NOW }),
      ).rejects.toThrow(/signature mismatch/i);
    });

    it("rejects a wrong-length v1 hex without timing leak", async () => {
      const header = `t=${FROZEN_T},v1=deadbeef`;
      await expect(
        verifyWebhookSignature(rawBody, header, SECRET, { now: FROZEN_NOW }),
      ).rejects.toThrow(/signature mismatch/i);
    });

    describe("tolerance (clock-skew freshness)", () => {
      it("rejects signatures older than the tolerance", async () => {
        const old = FROZEN_T - 400; // beyond default 300s
        const header = await signedHeader(old, rawBody);
        await expect(
          verifyWebhookSignature(rawBody, header, SECRET, { now: FROZEN_NOW }),
        ).rejects.toThrow(/tolerance/);
      });

      it("rejects signatures too far in the future", async () => {
        const future = FROZEN_T + 400;
        const header = await signedHeader(future, rawBody);
        await expect(
          verifyWebhookSignature(rawBody, header, SECRET, { now: FROZEN_NOW }),
        ).rejects.toThrow(/tolerance/);
      });

      it("respects a custom tolerance", async () => {
        const stale = FROZEN_T - 1_000;
        const header = await signedHeader(stale, rawBody);
        await expect(
          verifyWebhookSignature(rawBody, header, SECRET, {
            now: FROZEN_NOW,
            toleranceSeconds: 5_000,
          }),
        ).resolves.toBeUndefined();
      });

      it("disables the check when toleranceSeconds=0", async () => {
        const ancient = FROZEN_T - 1_000_000;
        const header = await signedHeader(ancient, rawBody);
        await expect(
          verifyWebhookSignature(rawBody, header, SECRET, {
            now: FROZEN_NOW,
            toleranceSeconds: 0,
          }),
        ).resolves.toBeUndefined();
      });
    });

    it("verifies the first recognized version slot when multiple are present", async () => {
      // Future-compat: server emits v1 alongside hypothetical v2; SDK only
      // knows v1 today and verifies that.
      const v1 = await computeSignatureV1(rawBody, SECRET, FROZEN_T);
      const header = `t=${FROZEN_T},v1=${v1},v2=ignoredfornowdeadbeef`;
      await expect(
        verifyWebhookSignature(rawBody, header, SECRET, { now: FROZEN_NOW }),
      ).resolves.toBeUndefined();
    });

    it("accepts Uint8Array body", async () => {
      const bytes = new TextEncoder().encode(rawBody);
      const header = await signedHeader(FROZEN_T, rawBody);
      await expect(
        verifyWebhookSignature(bytes, header, SECRET, { now: FROZEN_NOW }),
      ).resolves.toBeUndefined();
    });
  });

  describe("isValidWebhookSignature", () => {
    it("returns true on a valid signature", async () => {
      const header = await signedHeader(FROZEN_T, rawBody);
      expect(await isValidWebhookSignature(rawBody, header, SECRET, { now: FROZEN_NOW })).toBe(
        true,
      );
    });

    it("returns false on tampered body", async () => {
      const header = await signedHeader(FROZEN_T, rawBody);
      expect(
        await isValidWebhookSignature("not_the_body", header, SECRET, { now: FROZEN_NOW }),
      ).toBe(false);
    });

    it("returns false on stale signature (boolean, not throw)", async () => {
      const header = await signedHeader(FROZEN_T - 9_999, rawBody);
      expect(await isValidWebhookSignature(rawBody, header, SECRET, { now: FROZEN_NOW })).toBe(
        false,
      );
    });
  });

  describe("constructEvent", () => {
    it("verifies + parses to a typed event", async () => {
      const header = await signedHeader(FROZEN_T, rawBody);
      const event = await constructEvent(rawBody, header, SECRET, { now: FROZEN_NOW });
      expect(event.eventName).toBe("order.paid");
      expect(event.entityId).toBe("order_1");
    });

    it("rejects non-JSON body even with a valid signature", async () => {
      const bad = "not json";
      const header = await signedHeader(FROZEN_T, bad);
      await expect(
        constructEvent(bad, header, SECRET, { now: FROZEN_NOW }),
      ).rejects.toBeInstanceOf(VatlyInvalidSignatureError);
    });
  });

  describe("constructEventFromRequest", () => {
    it("reads Vatly-Signature from the Request and verifies", async () => {
      const header = await signedHeader(FROZEN_T, rawBody);
      const request = new Request("https://merchant.example/webhook", {
        method: "POST",
        body: rawBody,
        headers: { [VATLY_SIGNATURE_HEADER]: header, "Content-Type": "application/json" },
      });
      const event = await constructEventFromRequest(request, SECRET, { now: FROZEN_NOW });
      expect(event.eventName).toBe("order.paid");
    });

    it("is header-name case-insensitive (HTTP spec)", async () => {
      const header = await signedHeader(FROZEN_T, rawBody);
      const request = new Request("https://merchant.example/webhook", {
        method: "POST",
        body: rawBody,
        headers: { "vatly-signature": header },
      });
      const event = await constructEventFromRequest(request, SECRET, { now: FROZEN_NOW });
      expect(event.id).toBe("webhook_event_x");
    });

    it("rejects when Vatly-Signature is missing", async () => {
      const request = new Request("https://merchant.example/webhook", {
        method: "POST",
        body: rawBody,
      });
      await expect(
        constructEventFromRequest(request, SECRET, { now: FROZEN_NOW }),
      ).rejects.toBeInstanceOf(VatlyInvalidSignatureError);
    });
  });

  describe("header constants", () => {
    it("VATLY_SIGNATURE_HEADER is `Vatly-Signature` (RFC 6648, no X- prefix)", () => {
      expect(VATLY_SIGNATURE_HEADER).toBe("Vatly-Signature");
    });

    it("VATLY_EVENT_ID_HEADER is `Vatly-Event-Id`", () => {
      expect(VATLY_EVENT_ID_HEADER).toBe("Vatly-Event-Id");
    });
  });
});
