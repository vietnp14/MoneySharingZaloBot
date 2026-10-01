import OpenAI from "openai";
import type { Ledger } from "./types.js";

export async function answerAnalyticsQuestion(question: string, ledger: Ledger): Promise<string> {
  if (!process.env.OPENAI_API_KEY) return "Chưa cấu hình khóa API cho trợ lý AI.";

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL ?? "gpt-6-luna";

  const compactLedger = {
    expenses: ledger.expenses
      .filter((expense) => !expense.deletedAt)
      .slice(-200)
      .map((expense) => ({
        id: expense.sequence,
        payer: expense.payer.name,
        amountVnd: expense.amountVnd,
        description: expense.description,
        participants: expense.participants.map((participant) => participant.name),
        createdAt: expense.createdAt
      })),
    settlements: ledger.settlements
      .filter((settlement) => !settlement.deletedAt)
      .slice(-200)
      .map((settlement) => ({
        id: settlement.sequence,
        from: settlement.from.name,
        to: settlement.to.name,
        amountVnd: settlement.amountVnd,
        createdAt: settlement.createdAt
      }))
  };

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "Bạn trả lời câu hỏi thống kê về sổ chi tiêu chung. Luôn trả lời bằng tiếng Việt, ngắn gọn. Nếu dữ liệu không đủ, hãy nói: 'Tôi không biết.' Đơn vị tiền là VND."
      },
      {
        role: "user",
        content: `Câu hỏi: ${question}\nDữ liệu chi tiêu JSON: ${JSON.stringify(compactLedger)}`
      }
    ]
  });

  return response.output_text.trim() || "Tôi không biết.";
}
