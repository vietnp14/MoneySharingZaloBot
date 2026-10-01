import { describe, expect, it } from "vitest";
import { calculateDebtTransfers } from "../src/debts.js";
import type { Ledger, UserRef } from "../src/types.js";

const a: UserRef = { id: "a", name: "A" };
const b: UserRef = { id: "b", name: "B" };
const c: UserRef = { id: "c", name: "C" };

describe("debt calculation", () => {
  it("minimizes shared expense settlements", () => {
    const ledger: Ledger = {
      expenses: [
        expense(1, a, 300000),
        expense(2, b, 150000),
        expense(3, c, 600000)
      ],
      settlements: []
    };

    expect(calculateDebtTransfers(ledger)).toEqual([
      { from: b, to: c, amountVnd: 200000 },
      { from: a, to: c, amountVnd: 50000 }
    ]);
  });
});

function expense(sequence: number, payer: UserRef, amountVnd: number) {
  return {
    id: String(sequence),
    groupId: "g",
    sequence,
    payer,
    amountVnd,
    description: "test",
    participants: [a, b, c],
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z"
  };
}
