import { summarizeExpenses, startOfMonth, startOfWeek } from "./analytics.js";
import { includeSender, parseCommand } from "./commands.js";
import { summarizeDebts } from "./debts.js";
import { formatMoneyVnd } from "./money.js";
import { answerAnalyticsQuestion } from "./openaiClient.js";
import type { Storage } from "./storage.js";
import type { ZaloIncomingMessage } from "./types.js";

export async function handleMessage(storage: Storage, message: ZaloIncomingMessage): Promise<string> {
  const parsed = parseCommand(message.text);
  const groupId = message.chat.id;
  const now = new Date().toISOString();

  if (parsed.kind === "unknown") return parsed.reason;
  if (parsed.kind === "help") return helpText();

  await storage.getGroup(groupId);
  await storage.upsertMembers(groupId, [message.from]);

  if (parsed.kind === "spend") {
    const participants = includeSender(parsed.participants, message.from);
    await storage.upsertMembers(groupId, participants);
    const expense = await storage.addExpense({
      groupId,
      payer: message.from,
      amountVnd: parsed.amountVnd,
      description: parsed.description,
      participants,
      createdAt: now,
      updatedAt: now
    });
    return `Saved #${expense.sequence}: ${message.from.name} paid ${formatMoneyVnd(expense.amountVnd)} for ${expense.description}, split ${participants.length} ways.`;
  }

  if (parsed.kind === "edit") {
    const participants = includeSender(parsed.participants, message.from);
    await storage.upsertMembers(groupId, participants);
    const expense = await storage.updateExpense(groupId, parsed.sequence, message.from.id, {
      amountVnd: parsed.amountVnd,
      description: parsed.description,
      participants
    });
    if (!expense) return `Cannot edit #${parsed.sequence}. Only the original payer can edit their own expense.`;
    return `Updated #${expense.sequence}: ${formatMoneyVnd(expense.amountVnd)} for ${expense.description}.`;
  }

  if (parsed.kind === "delete") {
    const deleted = await storage.deleteExpense(groupId, parsed.sequence, message.from.id);
    return deleted
      ? `Deleted #${parsed.sequence}.`
      : `Cannot delete #${parsed.sequence}. Only the original payer can delete their own expense.`;
  }

  if (parsed.kind === "settle") {
    await storage.upsertMembers(groupId, [parsed.to]);
    const settlement = await storage.addSettlement({
      groupId,
      from: message.from,
      to: parsed.to,
      amountVnd: parsed.amountVnd,
      createdAt: now
    });
    return `Saved settlement #${settlement.sequence}: ${message.from.name} paid ${parsed.to.name} ${formatMoneyVnd(parsed.amountVnd)}.`;
  }

  if (parsed.kind === "debt") {
    return summarizeDebts(await storage.getLedger(groupId));
  }

  if (parsed.kind === "week") {
    const expenses = await storage.getExpensesSince(groupId, startOfWeek());
    return summarizeExpenses("This week", expenses);
  }

  if (parsed.kind === "month") {
    const expenses = await storage.getExpensesSince(groupId, startOfMonth());
    return summarizeExpenses("This month", expenses);
  }

  if (parsed.kind === "ask") {
    return answerAnalyticsQuestion(parsed.question, await storage.getLedger(groupId));
  }

  return "I don't know.";
}

function helpText(): string {
  return [
    "Commands:",
    "/spend 300k breakfast @An @Binh",
    "/chi 300k an sang @An @Binh",
    "/debt or /no",
    "/week or /tuan",
    "/month or /thang",
    "/edit 12 350k breakfast @An @Binh",
    "/delete 12",
    "/settle @An 100k",
    "/ask how much did we spend on coffee this month?"
  ].join("\n");
}
