import { describe, expect, it } from "vitest";
import { parseCommand } from "../src/commands.js";

describe("command parsing with a bot mention", () => {
  it("accepts a multi-word bot mention before help", () => {
    expect(parseCommand("@Bot Money Sharing /trogiup")).toEqual({ kind: "help" });
    expect(parseCommand("/trogiup")).toEqual({ kind: "help" });
  });

  it("preserves expense participant mentions", () => {
    expect(parseCommand("@Bot Money Sharing /chi 300k ăn sáng @An @Binh"))
      .toEqual(parseCommand("/chi 300k ăn sáng @An @Binh"));
    expect(parseCommand("/chi 300k ăn sáng @An @Binh")).toMatchObject({
      kind: "spend",
      participants: [{ id: "name:an", name: "An" }, { id: "name:binh", name: "Binh" }]
    });
  });

  it("extracts the AI question after removing the bot mention", () => {
    expect(parseCommand("  @Bot Money Sharing /hoi Nhóm đã chi bao nhiêu?  "))
      .toEqual({ kind: "ask", question: "Nhóm đã chi bao nhiêu?" });
  });
  it.each(["/spend", "/pay", "/edit", "/delete", "/del", "/debt", "/week", "/month", "/settle", "/clear", "/ask", "/help"])("rejects English command %s", (command) => {
    expect(parseCommand(command)).toEqual({ kind: "unknown", reason: "Lệnh không hợp lệ. Gửi /trợgiúp để xem hướng dẫn." });
  });
  it.each([
    ["/no", "debt"], ["/tuan", "week"], ["/thang", "month"],
    ["/tra @An 100k", "settle"], ["/sua 1 300k ăn sáng @An", "edit"], ["/xoa 1", "delete"]
  ])("accepts Vietnamese command %s", (command, kind) => {
    expect(parseCommand(command).kind).toBe(kind);
  });

  it("does not interpret commands embedded in ordinary text", () => {
    expect(parseCommand("Please send /help").kind).toBe("unknown");
    expect(parseCommand("@Bot Money Sharing hello").kind).toBe("unknown");
  });

  it.each([
    ["/nợ", "/no"], ["/tuần", "/tuan"], ["/tháng", "/thang"],
    ["/sửa 1 300k ăn sáng @An", "/sua 1 300k ăn sáng @An"],
    ["/xóa 1", "/xoa 1"], ["/trả @An 100k", "/tra @An 100k"],
    ["/hỏi Nhóm chi bao nhiêu?", "/hoi Nhóm chi bao nhiêu?"],
    ["/trợgiúp", "/trogiup"]
  ])("accepts accented command %s with or without a bot mention", (accented, plain) => {
    expect(parseCommand(accented)).toEqual(parseCommand(plain));
    expect(parseCommand(`@Bot Money Sharing ${accented}`)).toEqual(parseCommand(plain));
    const decomposedCommand = accented.replace(/^\S+/, (token) => token.normalize("NFD"));
    expect(parseCommand(`@Bot Money Sharing ${decomposedCommand}`)).toEqual(parseCommand(plain));
  });

  it("accepts uppercase accented commands", () => {
    expect(parseCommand("/NỢ")).toEqual({ kind: "debt" });
  });
});
