import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeZaloMessage, sendZaloMessage } from "../src/zalo.js";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Zalo messaging", () => {
  it("parses the documented webhook envelope", () => {
    expect(normalizeZaloMessage({ ok: true, result: { message: {
      text: "/trogiup",
      from: { id: "user-1", display_name: "An" },
      chat: { id: "group-1", chat_type: "GROUP" }
    } } })).toMatchObject({
      text: "/trogiup", from: { id: "user-1", name: "An" },
      chat: { id: "group-1", type: "GROUP" }
    });
  });

  it("fails explicitly when the bot token is missing", async () => {
    vi.stubEnv("ZALO_BOT_TOKEN", "");
    await expect(sendZaloMessage("chat-1", "Help")).rejects.toThrow("ZALO_BOT_TOKEN is missing");
  });

  it("detects API errors even when HTTP status is 200", async () => {
    vi.stubEnv("ZALO_BOT_TOKEN", "test-token");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: false, error_code: 401, description: "Invalid token"
    }), { status: 200 })));
    await expect(sendZaloMessage("chat-1", "Help")).rejects.toThrow("Invalid token");
  });

  it("sends the reply to the original chat", async () => {
    vi.stubEnv("ZALO_BOT_TOKEN", "test-token");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal("fetch", fetchMock);
    await sendZaloMessage("group-1", "Help");
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      body: JSON.stringify({ chat_id: "group-1", text: "Help" })
    }));
  });
});
