import { formatMoneyVnd } from "./money.js";
import type { Expense } from "./types.js";

export function startOfWeek(date = new Date()): Date {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day + 1);
  return copy;
}

export function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function summarizeExpenses(title: string, expenses: Expense[]): string {
  const active = expenses.filter((expense) => !expense.deletedAt);
  if (active.length === 0) return `${title}\nNo spending recorded.`;

  const total = active.reduce((sum, expense) => sum + expense.amountVnd, 0);
  const byPayer = new Map<string, { name: string; total: number }>();

  for (const expense of active) {
    const current = byPayer.get(expense.payer.id) ?? { name: expense.payer.name, total: 0 };
    current.total += expense.amountVnd;
    byPayer.set(expense.payer.id, current);
  }

  const payerLines = [...byPayer.values()]
    .sort((a, b) => b.total - a.total)
    .map((item) => `- ${item.name}: ${formatMoneyVnd(item.total)}`)
    .join("\n");

  return `${title}\nTotal: ${formatMoneyVnd(total)}\nExpenses: ${active.length}\nPaid by:\n${payerLines}`;
}
