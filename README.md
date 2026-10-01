# Money Sharing Zalo Bot

Command-first Smart MVP for a closed Zalo group. The bot records shared expenses, keeps per-group history forever, calculates current debt, supports user-owned edit/delete, and can answer simple analytics questions through OpenAI.

## MVP Commands

```text
/spend 300k breakfast @An @Binh @Cuong
/chi 300k an sang @An @Binh @Cuong

/debt
/no

/week
/month

/edit 12 350k breakfast @An @Binh @Cuong
/sua 12 350k an sang @An @Binh @Cuong

/delete 12
/xoa 12

/settle @Cuong 100k
/tra @Cuong 100k

/help
/ask how much did we spend this month on coffee?
```

The payer is always the sender. Participants are the people mentioned in the command. If the sender is not listed, the bot automatically includes them.

## Run Locally

```bash
npm install
cp .env.example .env
npm run dev
```

For local testing without Firebase, set:

```text
STORAGE_DRIVER=memory
```

## Zalo Notes

Zalo Bot supports webhook and long polling. For production, use webhook with an HTTPS URL. Zalo OA group messaging APIs require group-management permission, so group behavior must be validated with your actual bot/OA permissions before relying on it in production.

## Storage

The default storage target is Firestore because it fits per-group history, edit/delete ownership checks, and settlement events better than Google Sheets. Google Sheets can be added later as an export or secondary adapter.
