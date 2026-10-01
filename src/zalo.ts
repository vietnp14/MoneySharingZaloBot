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
      name: String(message.from?.display_name ?? message.from?.name ?? "Unknown")
    }
  };
}

export async function sendZaloMessage(chatId: string, text: string): Promise<void> {
  const token = process.env.ZALO_BOT_TOKEN;
  if (!token) {
    console.log(`[zalo:dry-run] ${chatId}: ${text}`);
    return;
  }

  const response = await fetch(`https://bot-api.zaloplatforms.com/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Zalo sendMessage failed: ${response.status} ${body}`);
  }
}
