import { describe, expect, it } from "vitest";
import { formatMoneyVnd, parseMoneyVnd } from "../src/money.js";

describe("money helpers", () => {
  it("parses thousand-style amounts", () => {
    expect(parseMoneyVnd("300k")).toBe(300000);
    expect(parseMoneyVnd("1.5k")).toBe(1500);
    expect(parseMoneyVnd("1,5k")).toBe(1500);
  });

  it("formats common VND amounts", () => {
    expect(formatMoneyVnd(300000)).toBe("300k");
    expect(formatMoneyVnd(333)).toBe("333đ");
  });
});
