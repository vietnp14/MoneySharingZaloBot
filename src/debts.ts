import { formatMoneyVnd } from "./money.js";
import type { Expense, Ledger, Settlement, UserRef } from "./types.js";

export type DebtTransfer = {
  from: UserRef;
  to: UserRef;
  amountVnd: number;
};

type Balance = {
  user: UserRef;
  amountVnd: number;
};

export function calculateBalances(ledger: Ledger): Map<string, Balance> {
  const balances = new Map<string, Balance>();

  for (const expense of ledger.expenses.filter((item) => !item.deletedAt)) {
    applyExpense(balances, expense);
  }

  for (const settlement of ledger.settlements.filter((item) => !item.deletedAt)) {
    addBalance(balances, settlement.from, settlement.amountVnd);
    addBalance(balances, settlement.to, -settlement.amountVnd);
  }

  return balances;
}

export function calculateDebtTransfers(ledger: Ledger): DebtTransfer[] {
  const balances = [...calculateBalances(ledger).values()].filter((item) => item.amountVnd !== 0);
  const debtors = balances
    .filter((item) => item.amountVnd < 0)
    .map((item) => ({ ...item, amountVnd: -item.amountVnd }))
    .sort((a, b) => b.amountVnd - a.amountVnd);
  const creditors = balances
    .filter((item) => item.amountVnd > 0)
    .sort((a, b) => b.amountVnd - a.amountVnd);

  const transfers: DebtTransfer[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountVnd = Math.min(debtor.amountVnd, creditor.amountVnd);

    if (amountVnd > 0) transfers.push({ from: debtor.user, to: creditor.user, amountVnd });

    debtor.amountVnd -= amountVnd;
    creditor.amountVnd -= amountVnd;
    if (debtor.amountVnd === 0) debtorIndex += 1;
    if (creditor.amountVnd === 0) creditorIndex += 1;
  }

  return transfers;
}

export function summarizeDebts(ledger: Ledger): string {
  const transfers = calculateDebtTransfers(ledger);
  if (transfers.length === 0) return "No current debt. Everyone is balanced.";

  return transfers
    .map((transfer) => `${transfer.from.name} owes ${transfer.to.name}: ${formatMoneyVnd(transfer.amountVnd)}`)
    .join("\n");
}

function applyExpense(balances: Map<string, Balance>, expense: Expense): void {
  addBalance(balances, expense.payer, expense.amountVnd);

  const sortedParticipants = [...expense.participants].sort((a, b) => a.id.localeCompare(b.id));
  const baseShare = Math.floor(expense.amountVnd / sortedParticipants.length);
  let remainder = expense.amountVnd % sortedParticipants.length;

  for (const participant of sortedParticipants) {
    const share = baseShare + (remainder > 0 ? 1 : 0);
    remainder -= remainder > 0 ? 1 : 0;
    addBalance(balances, participant, -share);
  }
}

function addBalance(balances: Map<string, Balance>, user: UserRef, amountVnd: number): void {
  const current = balances.get(user.id) ?? { user, amountVnd: 0 };
  balances.set(user.id, { user: current.user, amountVnd: current.amountVnd + amountVnd });
}
