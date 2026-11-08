import { describe, expect, it } from "vitest";
import { buildClientInfoHeader, detectMode, detectRuntime, resolveConfig } from "./config.js";

// Matches ^(live|test)_[\w|]{18,}$ — at least 18 chars after the prefix.
const VALID_LIVE_KEY = "live_abcdefghij0123456789";
const VALID_TEST_KEY = "test_abcdefghij0123456789";

describe("config", () => {
  describe("detectMode (B2 — strict regex)", () => {
    it("returns 'live' for a valid live key", () => {
      expect(detectMode(VALID_LIVE_KEY)).toBe("live");
    });

    it("returns 'test' for a valid test key", () => {
      expect(detectMode(VALID_TEST_KEY)).toBe("test");
    });

    it("accepts the pipe character in the secret portion", () => {
      expect(detectMode("test_abc|def|ghi|jkl|mno")).toBe("test");
    });

    it("throws on bad prefix", () => {
      expect(() => detectMode("sk_abcdefghij0123456789")).toThrow(/must start with/);
    });

    it("throws on too-short secret portion (<18 chars)", () => {
      expect(() => detectMode("live_short")).toThrow(/at least 18 characters/);
      expect(() => detectMode("live_abc123")).toThrow(/at least 18 characters/);
    });

    it("throws on empty string", () => {
      expect(() => detectMode("")).toThrow(/must start with/);
    });

    it("rejects characters outside [\\w|] in the secret portion", () => {
      // hyphens and spaces are invalid
      expect(() => detectMode("test_abcdefghij012345-789")).toThrow(/must start with/);
      expect(() => detectMode("test_abcdefghij012345 789")).toThrow(/must start with/);
    });
  });

  describe("resolveConfig", () => {
    it("rejects retry and timeout options that would skip requests or overflow arithmetic", () => {
      for (const maxRetries of [-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
        expect(() => resolveConfig({ apiKey: VALID_TEST_KEY, maxRetries })).toThrow(RangeError);
      }
      for (const timeoutMs of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
        expect(() => resolveConfig({ apiKey: VALID_TEST_KEY, timeoutMs })).toThrow(RangeError);
      }
    });

    it.each([VALID_LIVE_KEY, VALID_TEST_KEY])("uses the Vatly API for key %s", (apiKey) => {
      const cfg = resolveConfig({ apiKey });
      expect(cfg.baseUrl).toBe("https://api.vatly.com/v1");
    });

    it("allows an explicit baseUrl override", () => {
      const cfg = resolveConfig({
        apiKey: VALID_TEST_KEY,
        baseUrl: "https://example.com/api",
      });
      expect(cfg.baseUrl).toBe("https://example.com/api");
    });

    it("strips trailing slashes from baseUrl", () => {
      const cfg = resolveConfig({ apiKey: VALID_TEST_KEY, baseUrl: "https://example.com/api/" });
      expect(cfg.baseUrl).toBe("https://example.com/api");
    });

    it("throws on missing apiKey", () => {
      const prev = process.env.VATLY_API_KEY;
      // biome-ignore lint/performance/noDelete: process.env.X = undefined coerces to the string "undefined"; only delete actually unsets.
      delete process.env.VATLY_API_KEY;
      try {
        expect(() => resolveConfig({})).toThrow(/missing API key/);
      } finally {
        if (prev !== undefined) process.env.VATLY_API_KEY = prev;
      }
    });

    it("reads VATLY_API_KEY from env", () => {
      const prev = process.env.VATLY_API_KEY;
      process.env.VATLY_API_KEY = VALID_TEST_KEY;
      try {
        const cfg = resolveConfig({});
        expect(cfg.apiKey).toBe(VALID_TEST_KEY);
        expect(cfg.mode).toBe("test");
      } finally {
        // biome-ignore lint/performance/noDelete: see above.
        if (prev === undefined) delete process.env.VATLY_API_KEY;
        else process.env.VATLY_API_KEY = prev;
      }
    });

    it("rejects bad-prefix apiKey at construction", () => {
      expect(() => resolveConfig({ apiKey: "bad_abcdefghij0123456789" })).toThrow(
        /must start with/,
      );
    });

    it("rejects too-short apiKey at construction", () => {
      expect(() => resolveConfig({ apiKey: "live_short" })).toThrow(/at least 18 characters/);
    });

    it("idempotencyKeyGenerator defaults to a UUID v4 source", () => {
      const cfg = resolveConfig({ apiKey: VALID_TEST_KEY });
      expect(typeof cfg.idempotencyKeyGenerator).toBe("function");
      const v = cfg.idempotencyKeyGenerator?.();
      expect(v).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it("idempotencyKeyGenerator: false disables auto-gen", () => {
      const cfg = resolveConfig({ apiKey: VALID_TEST_KEY, idempotencyKeyGenerator: false });
      expect(cfg.idempotencyKeyGenerator).toBeUndefined();
    });

    it("custom idempotencyKeyGenerator is honored", () => {
      const cfg = resolveConfig({
        apiKey: VALID_TEST_KEY,
        idempotencyKeyGenerator: () => "fixed",
      });
      expect(cfg.idempotencyKeyGenerator?.()).toBe("fixed");
    });
  });

  describe("Vatly-Client-Info (B4)", () => {
    it("detectRuntime returns a node descriptor in vitest", () => {
      const d = detectRuntime();
      expect(d.runtime).toMatch(/^node\//);
      expect(d.os).toBeTypeOf("string");
      expect(d.arch).toBeTypeOf("string");
    });

    it("buildClientInfoHeader returns key=value; key=value with auto-detected defaults", () => {
      const h = buildClientInfoHeader(undefined);
      expect(h).toBeDefined();
      expect(h).toMatch(/sdk=vatly-sdk-js\/[\d.]+/);
      expect(h).toMatch(/runtime=node\//);
      expect(h!.split("; ").length).toBeGreaterThanOrEqual(2);
    });

    it("appends app and framework after defaults when provided", () => {
      const h = buildClientInfoHeader({ app: "MyApp/1.2.3", framework: "Next.js/14" });
      expect(h).toContain("sdk=vatly-sdk-js/");
      expect(h).toMatch(/app=MyApp\/1\.2\.3; framework=Next\.js\/14$/);
    });

    it("does not allow overriding sdk/runtime/os/arch", () => {
      // Even if a caller could squeeze unrelated keys in, the typed surface only
      // accepts `app` and `framework`. Default `runtime` survives intact.
      const h = buildClientInfoHeader({ app: "X/1" });
      expect(h!.match(/runtime=/g)!.length).toBe(1);
      expect(h).toMatch(/runtime=node\//);
    });

    it("returns the defaults-only header when info is undefined", () => {
      const h = buildClientInfoHeader(undefined);
      expect(h).not.toContain("app=");
      expect(h).not.toContain("framework=");
    });

    it("returns undefined when info === false", () => {
      expect(buildClientInfoHeader(false)).toBeUndefined();
    });

    it("sanitizes header-breaking chars in values", () => {
      const h = buildClientInfoHeader({ app: "Evil; injected, value\r\n" });
      expect(h).not.toContain(",");
      expect(h).toContain("app=Evil injected value");
    });

    it("truncates oversized values to 64 chars", () => {
      const long = "x".repeat(200);
      const h = buildClientInfoHeader({ app: long });
      const match = /app=([^;]+)/.exec(h ?? "");
      expect(match).not.toBeNull();
      expect(match![1]!.length).toBe(64);
    });

    it("skips empty / whitespace-only fields", () => {
      const h = buildClientInfoHeader({ app: "  \r\n  ", framework: "" });
      expect(h).not.toContain("app=");
      expect(h).not.toContain("framework=");
    });
  });

  describe("browser usage block", () => {
    it("throws when window+document are defined and no opt-out", () => {
      const g = globalThis as unknown as { window?: unknown; document?: unknown };
      const prevWindow = g.window;
      const prevDocument = g.document;
      g.window = {};
      g.document = {};
      try {
        expect(() => resolveConfig({ apiKey: VALID_TEST_KEY })).toThrow(
          /must not be instantiated in a browser/,
        );
      } finally {
        g.window = prevWindow;
        g.document = prevDocument;
      }
    });

    it("dangerouslyAllowBrowser bypasses the guard", () => {
      const g = globalThis as unknown as { window?: unknown; document?: unknown };
      const prevWindow = g.window;
      const prevDocument = g.document;
      g.window = {};
      g.document = {};
      try {
        const cfg = resolveConfig({
          apiKey: VALID_TEST_KEY,
          dangerouslyAllowBrowser: true,
        });
        expect(cfg.apiKey).toBe(VALID_TEST_KEY);
      } finally {
        g.window = prevWindow;
        g.document = prevDocument;
      }
    });

    it("does not trip on jsdom/happy-dom (UA-guarded)", () => {
      // navigator is a non-configurable global in modern Node; use defineProperty.
      const g = globalThis as unknown as { window?: unknown; document?: unknown };
      const prevWindow = g.window;
      const prevDocument = g.document;
      const prevDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");
      g.window = {};
      g.document = {};
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Mozilla/5.0 (linux) jsdom/22.0.0" },
        configurable: true,
        writable: true,
      });
      try {
        expect(() => resolveConfig({ apiKey: VALID_TEST_KEY })).not.toThrow();
      } finally {
        g.window = prevWindow;
        g.document = prevDocument;
        if (prevDesc) {
          Object.defineProperty(globalThis, "navigator", prevDesc);
        } else {
          (globalThis as { navigator?: unknown }).navigator = undefined;
        }
      }
    });
  });
});
