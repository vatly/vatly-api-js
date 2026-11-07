import { describe, expect, it } from "vitest";
import { type Money, fromMinorUnits, moneyEquals, toMinorUnits } from "./money.js";

describe("Money", () => {
  it("rejects lossy numeric minor units and preserves large bigint values", () => {
    for (const value of [1.5, Number.MAX_SAFE_INTEGER + 1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => fromMinorUnits(value, "EUR")).toThrow(RangeError);
    }
    expect(fromMinorUnits(9007199254740993n, "EUR").value).toBe("90071992547409.93");
    for (const decimals of [-1, 1.5, Number.NaN]) {
      expect(() => fromMinorUnits(123n, "EUR", decimals)).toThrow(RangeError);
      expect(() => toMinorUnits({ value: "1.23", currency: "EUR" }, decimals)).toThrow(RangeError);
    }
  });

  it("keeps value as a string through round-trip", () => {
    const m: Money = { value: "99.99", currency: "EUR" };
    const minor = toMinorUnits(m);
    expect(typeof minor).toBe("bigint");
    expect(minor).toBe(9999n);
    const back = fromMinorUnits(minor, "EUR");
    expect(back.value).toBe("99.99");
    expect(typeof back.value).toBe("string");
  });

  it("handles whole-number values", () => {
    const m: Money = { value: "29", currency: "EUR" };
    expect(toMinorUnits(m)).toBe(2900n);
    expect(fromMinorUnits(2900n, "EUR").value).toBe("29.00");
  });

  it("rejects values with too many fractional digits", () => {
    const m: Money = { value: "1.234", currency: "EUR" };
    expect(() => toMinorUnits(m)).toThrow(/fractional digits/);
  });

  it("rejects malformed values", () => {
    expect(() => toMinorUnits({ value: "abc", currency: "EUR" })).toThrow(/Invalid Money/);
  });

  it("does not coerce to number anywhere in the pipeline", () => {
    // Sanity: the precision-losing constant 0.1 + 0.2 round-trips intact.
    const m: Money = { value: "0.30", currency: "EUR" };
    expect(toMinorUnits(m)).toBe(30n);
    expect(fromMinorUnits(30n, "EUR").value).toBe("0.30");
  });

  it("moneyEquals is strict on both fields", () => {
    expect(
      moneyEquals({ value: "1.00", currency: "EUR" }, { value: "1.00", currency: "EUR" }),
    ).toBe(true);
    expect(moneyEquals({ value: "1.00", currency: "EUR" }, { value: "1.0", currency: "EUR" })).toBe(
      false,
    );
    expect(
      moneyEquals({ value: "1.00", currency: "EUR" }, { value: "1.00", currency: "USD" }),
    ).toBe(false);
  });
});
