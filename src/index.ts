import express from "express";
import { FirestoreStorage } from "./firestoreStorage.js";
import { handleMessage } from "./handler.js";
import { MemoryStorage } from "./memoryStorage.js";
import type { Storage } from "./storage.js";
import { normalizeZaloMessage, sendZaloMessage } from "./zalo.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const storage: Storage = process.env.STORAGE_DRIVER === "memory" ? new MemoryStorage() : new FirestoreStorage();

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/webhook/zalo", async (req, res) => {
  const expectedSecret = process.env.ZALO_WEBHOOK_SECRET;
  if (expectedSecret && req.header("X-Bot-Api-Secret-Token") !== expectedSecret) {
    res.status(401).json({ ok: false });
    return;
  }

  const message = normalizeZaloMessage(req.body);
  if (!message) {
    res.json({ ok: true, ignored: true });
    return;
  }

  try {
    const reply = await handleMessage(storage, message);
    await sendZaloMessage(message.chat.id, reply);
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

app.listen(port, () => {
  console.log(`Money Sharing Zalo Bot listening on :${port}`);
});
