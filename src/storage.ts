import type { Expense, GroupState, Ledger, Settlement, UserRef } from "./types.js";

export interface Storage {
  getGroup(groupId: string): Promise<GroupState>;
  upsertMembers(groupId: string, members: UserRef[]): Promise<void>;
  addExpense(expense: Omit<Expense, "id" | "sequence">): Promise<Expense>;
  updateExpense(groupId: string, sequence: number, senderId: string, patch: Pick<Expense, "amountVnd" | "description" | "participants">): Promise<Expense | null>;
  deleteExpense(groupId: string, sequence: number, senderId: string): Promise<boolean>;
  addSettlement(settlement: Omit<Settlement, "id" | "sequence">): Promise<Settlement>;
  getLedger(groupId: string): Promise<Ledger>;
  getExpensesSince(groupId: string, since: Date): Promise<Expense[]>;
}
