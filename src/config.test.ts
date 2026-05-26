import { describe, expect, it } from "vitest";
import {
  buildClientInfoHeader,
  detectMode,
  detectRuntime,
  resolveConfig,
} from "./config.js";

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
    it("defaults to production base URL", () => {
      const cfg = resolveConfig({ apiKey: VALID_TEST_KEY });
      expect(cfg.baseUrl).toBe("https://api.vatly.com/v1");
    });

    it("selects staging when server='staging'", () => {
      const cfg = resolveConfig({ apiKey: VALID_TEST_KEY, server: "staging" });
      expect(cfg.baseUrl).toBe("https://api.staging.vatly.com/v1");
    });

    it("baseUrl overrides server", () => {
      const cfg = resolveConfig({
        apiKey: VALID_TEST_KEY,
        server: "staging",
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
      expect(v).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
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

  describe("X-Vatly-Client-Info (B4)", () => {
    it("detectRuntime returns a node descriptor in vitest", () => {
      const d = detectRuntime();
      expect(d.runtime).toMatch(/^node\//);
      expect(d.os).toBeTypeOf("string");
      expect(d.arch).toBeTypeOf("string");
    });

    it("buildClientInfoHeader returns key=value; key=value with defaults", () => {
      const h = buildClientInfoHeader(undefined);
      expect(h).toBeDefined();
      expect(h).toMatch(/sdk=vatly-sdk-js\/[\d.]+/);
      expect(h).toMatch(/runtime=node\//);
      // pairs are `; `-separated
      expect(h!.split("; ").length).toBeGreaterThanOrEqual(2);
    });

    it("merges user extras after defaults", () => {
      const h = buildClientInfoHeader({ app: "MyApp/1.2.3", framework: "Next.js/14" });
      expect(h).toContain("sdk=vatly-sdk-js/");
      expect(h).toContain("app=MyApp/1.2.3");
      expect(h).toContain("framework=Next.js/14");
    });

    it("user extras override defaults of the same key", () => {
      const h = buildClientInfoHeader({ runtime: "custom-runtime/9.9" });
      expect(h).toContain("runtime=custom-runtime/9.9");
      // and only once
      expect(h!.match(/runtime=/g)!.length).toBe(1);
    });

    it("undefined value in extras removes the default", () => {
      const h = buildClientInfoHeader({ os: undefined });
      expect(h).not.toContain("os=");
    });

    it("returns undefined when extras === false", () => {
      expect(buildClientInfoHeader(false)).toBeUndefined();
    });

    it("sanitizes header-breaking chars in values", () => {
      const h = buildClientInfoHeader({ app: "Evil; injected, value\r\n" });
      expect(h).not.toContain(",");
      // semicolons inside the value collapse to space; the only `; ` should be the pair separator
      expect(h).toContain("app=Evil injected value");
    });

    it("sanitizes header-breaking chars in keys", () => {
      const h = buildClientInfoHeader({ "ev;il=key": "v" });
      expect(h).toContain("ev_il_key=v");
    });
  });
});
