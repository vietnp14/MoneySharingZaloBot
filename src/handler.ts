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
    return `Đã lưu #${expense.sequence}: ${message.from.name} trả ${formatMoneyVnd(expense.amountVnd)} cho ${expense.description}, chia đều ${participants.length} người.`;
  }

  if (parsed.kind === "edit") {
    const participants = includeSender(parsed.participants, message.from);
    await storage.upsertMembers(groupId, participants);
    const expense = await storage.updateExpense(groupId, parsed.sequence, message.from.id, {
      amountVnd: parsed.amountVnd,
      description: parsed.description,
      participants
    });
    if (!expense) return `Không thể sửa #${parsed.sequence}. Khoản chi không tồn tại hoặc bạn không phải người tạo.`;
    return `Đã sửa #${expense.sequence}: ${formatMoneyVnd(expense.amountVnd)} cho ${expense.description}.`;
  }

  if (parsed.kind === "delete") {
    const deleted = await storage.deleteExpense(groupId, parsed.sequence, message.from.id);
    return deleted
      ? `Đã xóa #${parsed.sequence}.`
      : `Không thể xóa #${parsed.sequence}. Khoản chi không tồn tại hoặc bạn không phải người tạo.`;
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
    return `Đã ghi nhận trả nợ #${settlement.sequence}: ${message.from.name} trả ${parsed.to.name} ${formatMoneyVnd(parsed.amountVnd)}.`;
  }

  if (parsed.kind === "debt") {
    return summarizeDebts(await storage.getLedger(groupId));
  }

  if (parsed.kind === "week") {
    const expenses = await storage.getExpensesSince(groupId, startOfWeek());
    return summarizeExpenses("Tuần này", expenses);
  }

  if (parsed.kind === "month") {
    const expenses = await storage.getExpensesSince(groupId, startOfMonth());
    return summarizeExpenses("Tháng này", expenses);
  }

  if (parsed.kind === "ask") {
    return answerAnalyticsQuestion(parsed.question, await storage.getLedger(groupId));
  }

  return "Tôi không biết.";
}

function helpText(): string {
  return [
    "Các lệnh:",
    "/chi 300k ăn sáng @An @Binh",
    "/nợ - xem nợ hiện tại",
    "/tuần - chi tiêu tuần này",
    "/tháng - chi tiêu tháng này",
    "/sửa 12 350k ăn sáng @An @Binh",
    "/xóa 12",
    "/trả @An 100k",
    "/hỏi Tháng này nhóm chi bao nhiêu tiền cà phê?",
    "/trợgiúp - xem hướng dẫn"
  ].join("\n");
}
