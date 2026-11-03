import { describe, expect, it } from "vitest";
import { cleanNumber } from "../src/components/ui";
describe("numeric inputs", () => {
  it("rejects letters, exponents, signs and decimal separators for integers", () => {
    expect(cleanNumber("12e-3abc,.4")).toBe("1234");
  });
  it("accepts one Czech or decimal separator in pasted values", () => {
    expect(cleanNumber("12,34.5 Kč", true)).toBe("12,345");
    expect(cleanNumber("12.34", true)).toBe("12.34");
  });
});
