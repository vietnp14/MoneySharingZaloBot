import type { Storage } from "./storage.js";
import type { Expense, GroupState, Ledger, Settlement, UserRef } from "./types.js";

export class MemoryStorage implements Storage {
  private groups = new Map<string, GroupState>();
  private expenses = new Map<string, Expense[]>();
  private settlements = new Map<string, Settlement[]>();

  async getGroup(groupId: string): Promise<GroupState> {
    return this.ensureGroup(groupId);
  }

  async upsertMembers(groupId: string, members: UserRef[]): Promise<void> {
    const group = this.ensureGroup(groupId);
    for (const member of members) group.members[member.id] = member;
  }

  async addExpense(input: Omit<Expense, "id" | "sequence">): Promise<Expense> {
    const group = this.ensureGroup(input.groupId);
    const expense: Expense = { ...input, id: crypto.randomUUID(), sequence: group.nextSequence++ };
    this.expenses.set(input.groupId, [...(this.expenses.get(input.groupId) ?? []), expense]);
    return expense;
  }

  async updateExpense(
    groupId: string,
    sequence: number,
    senderId: string,
    patch: Pick<Expense, "amountVnd" | "description" | "participants">
  ): Promise<Expense | null> {
    const expense = (this.expenses.get(groupId) ?? []).find((item) => item.sequence === sequence && !item.deletedAt);
    if (!expense || expense.payer.id !== senderId) return null;
    Object.assign(expense, patch, { updatedAt: new Date().toISOString() });
    return expense;
  }

  async deleteExpense(groupId: string, sequence: number, senderId: string): Promise<boolean> {
    const expense = (this.expenses.get(groupId) ?? []).find((item) => item.sequence === sequence && !item.deletedAt);
    if (!expense || expense.payer.id !== senderId) return false;
    expense.deletedAt = new Date().toISOString();
    expense.updatedAt = expense.deletedAt;
    return true;
  }

  async addSettlement(input: Omit<Settlement, "id" | "sequence">): Promise<Settlement> {
    const group = this.ensureGroup(input.groupId);
    const settlement: Settlement = { ...input, id: crypto.randomUUID(), sequence: group.nextSequence++ };
    this.settlements.set(input.groupId, [...(this.settlements.get(input.groupId) ?? []), settlement]);
    return settlement;
  }

  async getLedger(groupId: string): Promise<Ledger> {
    return {
      expenses: this.expenses.get(groupId) ?? [],
      settlements: this.settlements.get(groupId) ?? []
    };
  }

  async getExpensesSince(groupId: string, since: Date): Promise<Expense[]> {
    return (this.expenses.get(groupId) ?? []).filter((item) => !item.deletedAt && new Date(item.createdAt) >= since);
  }

  private ensureGroup(groupId: string): GroupState {
    const current = this.groups.get(groupId);
    if (current) return current;

    const group: GroupState = { groupId, nextSequence: 1, members: {} };
    this.groups.set(groupId, group);
    return group;
  }
}
