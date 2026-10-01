import { describe, expect, it } from "vitest";
import { handleMessage } from "../src/handler.js";
import { MemoryStorage } from "../src/memoryStorage.js";

describe("Vietnamese bot replies", () => {
  it("handles the expense lifecycle and summaries in Vietnamese", async () => {
    const storage = new MemoryStorage();
    const send = (text: string) => handleMessage(storage, {
      text, chat: { id: "g", type: "GROUP" }, from: { id: "payer", name: "Lan" }
    });
    expect(await send("/trợgiúp")).toContain("/hỏi");
    expect(await send("/chi 300k ăn sáng @An")).toContain("Đã lưu #1");
    expect(await send("/no")).toBe("An nợ Lan: 150k");
    expect(await send("/tuan")).toContain("Tuần này\nTổng chi: 300k");
    expect(await send("/thang")).toContain("Người trả tiền:");
    expect(await send("/sua 1 400k ăn sáng @An")).toContain("Đã sửa #1");
    expect(await send("/xoa 1")).toBe("Đã xóa #1.");
    expect(await send("/no")).toContain("Hiện không có nợ");
    expect(await send("/tuan")).toContain("Chưa có khoản chi nào");
    expect(await send("/tra @An 100k")).toContain("Đã ghi nhận trả nợ");
    expect(await send("/xoa 999")).toContain("Không thể xóa");
    expect(await send("/sua 999 300k ăn sáng @An")).toContain("Không thể sửa");
  });
});
