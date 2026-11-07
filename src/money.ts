/**
 * Monetary value as returned by the Vatly API.
 *
 * IMPORTANT: `value` is intentionally a decimal string. NEVER coerce it to a
 * JavaScript `number` — IEEE-754 doubles cannot represent most decimal amounts
 * exactly, so `Number("0.1") + Number("0.2")` is the classic example of
 * precision loss. If you need to do arithmetic, use a decimal library
 * (decimal.js, big.js, dinero.js) or convert to integer minor units first.
 */
import type { components } from "./generated/schema.js";

export type Money = components["schemas"]["Money"];

/**
 * Convert a Money value to an integer count of minor units (e.g. cents).
 * Returns a `bigint` to avoid precision loss on large amounts. The result is
 * always positive or zero; the spec's pattern disallows negatives.
 *
 * @example toMinorUnits({ value: "29.00", currency: "EUR" }) // -> 2900n
 */
export function toMinorUnits(money: Money, decimals = 2): bigint {
  if (!Number.isSafeInteger(decimals) || decimals < 0)
    throw new RangeError("decimals must be a non-negative safe integer.");
  if (!/^\d+(\.\d{1,})?$/.test(money.value)) {
    throw new TypeError(`Invalid Money value: ${money.value}`);
  }
  const [whole, frac = ""] = money.value.split(".");
  if (frac.length > decimals) {
    throw new RangeError(
      `Money value "${money.value}" has more than ${decimals} fractional digits.`,
    );
  }
  const padded = frac.padEnd(decimals, "0");
  return BigInt(whole + padded);
}

/**
 * Construct a Money value from a minor-unit integer count.
 *
 * @example fromMinorUnits(2900n, "EUR") // -> { value: "29.00", currency: "EUR" }
 */
export function fromMinorUnits<C extends Money["currency"]>(
  minor: bigint | number,
  currency: C,
  decimals = 2,
): Money & { currency: C } {
  if (!Number.isSafeInteger(decimals) || decimals < 0)
    throw new RangeError("decimals must be a non-negative safe integer.");
  if (typeof minor === "number" && !Number.isSafeInteger(minor))
    throw new RangeError("Money minor units must be a safe integer; use bigint for large amounts.");
  const big = typeof minor === "bigint" ? minor : BigInt(minor);
  if (big < 0n) {
    throw new RangeError("Money minor units cannot be negative.");
  }
  const s = big.toString().padStart(decimals + 1, "0");
  const cut = s.length - decimals;
  const value = decimals === 0 ? s : `${s.slice(0, cut)}.${s.slice(cut)}`;
  return { value, currency };
}

/** Strict equality on `value` and `currency` (no normalization). */
export function moneyEquals(a: Money, b: Money): boolean {
  return a.value === b.value && a.currency === b.currency;
}
