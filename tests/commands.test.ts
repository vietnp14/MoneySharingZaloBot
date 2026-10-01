import { describe, expect, it } from "vitest";
import { parseCommand } from "../src/commands.js";

describe("command parsing with a bot mention", () => {
  it("accepts a multi-word bot mention before help", () => {
    expect(parseCommand("@Bot Money Sharing /help")).toEqual({ kind: "help" });
    expect(parseCommand("/help")).toEqual({ kind: "help" });
  });

  it("preserves expense participant mentions", () => {
    expect(parseCommand("@Bot Money Sharing /spend 300k breakfast @An @Binh"))
      .toEqual(parseCommand("/spend 300k breakfast @An @Binh"));
    expect(parseCommand("/spend 300k breakfast @An @Binh")).toMatchObject({
      kind: "spend",
      participants: [{ id: "name:an", name: "An" }, { id: "name:binh", name: "Binh" }]
    });
  });

  it("extracts the AI question after removing the bot mention", () => {
    expect(parseCommand("  @Bot Money Sharing /ask How much did we spend?  "))
      .toEqual({ kind: "ask", question: "How much did we spend?" });
  });

  it("does not interpret commands embedded in ordinary text", () => {
    expect(parseCommand("Please send /help").kind).toBe("unknown");
    expect(parseCommand("@Bot Money Sharing hello").kind).toBe("unknown");
  });
});
