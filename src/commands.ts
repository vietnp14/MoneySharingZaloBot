import { parseMoneyVnd } from "./money.js";
import type { UserRef } from "./types.js";

export type ParsedCommand =
  | {
      kind: "spend";
      amountVnd: number;
      description: string;
      participants: UserRef[];
    }
  | {
      kind: "edit";
      sequence: number;
      amountVnd: number;
      description: string;
      participants: UserRef[];
    }
  | { kind: "delete"; sequence: number }
  | { kind: "debt" }
  | { kind: "week" }
  | { kind: "month" }
  | { kind: "settle"; to: UserRef; amountVnd: number }
  | { kind: "ask"; question: string }
  | { kind: "help" }
  | { kind: "unknown"; reason: string };

const COMMAND_ALIASES: Record<string, string> = {
  "/chi": "spend",
  "/sua": "edit",
  "/xoa": "delete",
  "/no": "debt",
  "/tuan": "week",
  "/thang": "month",
  "/tra": "settle",
  "/hoi": "ask",
  "/trogiup": "help"
};

export function parseCommand(text: string): ParsedCommand {
  const commandText = text.trim().replace(/^@[^\r\n]*?\s+(?=\/[\p{L}\p{M}]+(?:\s|$))/iu, "");
  const parts = commandText.split(/\s+/);
  const rawCommand = parts[0]?.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const command = COMMAND_ALIASES[rawCommand];

  if (!command) return { kind: "unknown", reason: "Lệnh không hợp lệ. Gửi /trợgiúp để xem hướng dẫn." };

  if (command === "help") return { kind: "help" };
  if (command === "debt") return { kind: "debt" };
  if (command === "week") return { kind: "week" };
  if (command === "month") return { kind: "month" };

  if (command === "ask") {
    const question = commandText.slice(parts[0].length).trim();
    return question ? { kind: "ask", question } : { kind: "unknown", reason: "Cú pháp: /hỏi <câu hỏi>" };
  }

  if (command === "delete") {
    const sequence = Number(parts[1]);
    if (!Number.isInteger(sequence) || sequence <= 0) {
      return { kind: "unknown", reason: "Cú pháp: /xóa <mã khoản chi>" };
    }
    return { kind: "delete", sequence };
  }

  if (command === "settle") {
    const mention = parseMention(parts[1]);
    const amountVnd = parseMoneyVnd(parts[2] ?? "");
    if (!mention || !amountVnd) {
      return { kind: "unknown", reason: "Cú pháp: /trả @An 100k" };
    }
    return { kind: "settle", to: mention, amountVnd };
  }

  if (command === "spend") {
    const amountVnd = parseMoneyVnd(parts[1] ?? "");
    if (!amountVnd) return { kind: "unknown", reason: "Cú pháp: /chi 300k ăn sáng @An @Binh" };
    return parseExpensePayload(parts.slice(2), amountVnd);
  }

  if (command === "edit") {
    const sequence = Number(parts[1]);
    const amountVnd = parseMoneyVnd(parts[2] ?? "");
    if (!Number.isInteger(sequence) || sequence <= 0 || !amountVnd) {
      return { kind: "unknown", reason: "Cú pháp: /sửa <mã khoản chi> 300k ăn sáng @An @Binh" };
    }
    const parsed = parseExpensePayload(parts.slice(3), amountVnd);
    return parsed.kind === "spend" ? { ...parsed, kind: "edit", sequence } : parsed;
  }

  return { kind: "unknown", reason: "Lệnh không hợp lệ. Gửi /trợgiúp để xem hướng dẫn." };
}

function parseExpensePayload(tokens: string[], amountVnd: number): ParsedCommand {
  const participants = tokens.map(parseMention).filter((value): value is UserRef => Boolean(value));
  const description = tokens.filter((token) => !parseMention(token)).join(" ").trim();

  if (!description || participants.length === 0) {
    return { kind: "unknown", reason: "Cú pháp: /chi 300k ăn sáng @An @Binh" };
  }

  return { kind: "spend", amountVnd, description, participants: uniqueUsers(participants) };
}

function parseMention(token?: string): UserRef | null {
  if (!token?.startsWith("@")) return null;
  const name = token.slice(1).trim();
  if (!name) return null;

  // In real Zalo webhook payloads, mentions may include stable IDs. Until then,
  // normalize display mentions into deterministic local IDs per group.
  return { id: `name:${name.toLowerCase()}`, name };
}

export function includeSender(participants: UserRef[], sender: UserRef): UserRef[] {
  return uniqueUsers([sender, ...participants]);
}

function uniqueUsers(users: UserRef[]): UserRef[] {
  const byId = new Map<string, UserRef>();
  for (const user of users) byId.set(user.id, user);
  return [...byId.values()];
}
