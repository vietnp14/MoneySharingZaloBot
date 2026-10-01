import type { ZaloIncomingMessage } from "./types.js";

export function normalizeZaloMessage(body: unknown): ZaloIncomingMessage | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, any>;
  const message = value.message ?? value.result?.message;
  if (!message?.text) return null;

  return {
    text: String(message.text),
    messageId: message.message_id ?? message.mid,
    chat: {
      id: String(message.chat?.id ?? message.chat_id ?? value.chat_id ?? message.from?.id),
      type: String(message.chat?.chat_type ?? message.chat_type ?? "PRIVATE")
    },
    from: {
      id: String(message.from?.id ?? message.from_id ?? value.sender?.id ?? "unknown"),
      name: String(message.from?.display_name ?? message.from?.name ?? "Không rõ tên")
    }
  };
}

export async function sendZaloMessage(chatId: string, text: string): Promise<void> {
  const token = process.env.ZALO_BOT_TOKEN;
  if (!token) {
    throw new Error("ZALO_BOT_TOKEN is missing; cannot send a reply.");
  }

  const response = await fetch(`https://bot-api.zaloplatforms.com/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });

  const body = await response.json() as { ok?: boolean; error_code?: number; description?: string };
  if (!response.ok || body.ok !== true) {
    throw new Error(`Zalo sendMessage failed: HTTP ${response.status}, code ${body.error_code ?? "unknown"}: ${body.description ?? "API did not confirm success"}`);
  }
}
