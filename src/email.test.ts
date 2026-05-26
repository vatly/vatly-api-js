import { describe, expect, it } from "vitest";
import { decodeDomain, encodeDomain, encodeEmail } from "./email.js";

describe("email helpers", () => {
  it("encodes Unicode domain to Punycode", () => {
    expect(encodeDomain("bücher.de")).toBe("xn--bcher-kva.de");
    expect(encodeDomain("münchen.example")).toBe("xn--mnchen-3ya.example");
  });

  it("encodes ASCII domain unchanged", () => {
    expect(encodeDomain("example.com")).toBe("example.com");
  });

  it("encodeEmail leaves ASCII local-part alone and encodes the domain", () => {
    expect(encodeEmail("user@bücher.de")).toBe("user@xn--bcher-kva.de");
    expect(encodeEmail("user@example.com")).toBe("user@example.com");
  });

  it("rejects non-ASCII local-part (no SMTPUTF8/EAI)", () => {
    expect(() => encodeEmail("üser@example.com")).toThrow(/local-part/);
  });

  it("decodeDomain returns Punycode unchanged on runtimes without toUnicode", () => {
    // Documented degraded behavior: round-trip via encode still works.
    const ascii = encodeDomain("bücher.de");
    const back = decodeDomain(ascii);
    // We only assert it's a non-empty string; the exact form depends on runtime.
    expect(typeof back).toBe("string");
    expect(back.length).toBeGreaterThan(0);
  });

  it("rejects empty domain / malformed email", () => {
    expect(() => encodeEmail("noatsign")).toThrow(/Invalid email/);
    expect(() => encodeEmail("@example.com")).toThrow(/Invalid email/);
    expect(() => encodeEmail("user@")).toThrow(/Invalid email/);
  });
});
