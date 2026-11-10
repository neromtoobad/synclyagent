import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { readLedger, summarize } from "../server/lib/ledger";

export default defineAction({
  description:
    "Read the Syncly books: every transaction, every invoice, and the totals (money in, money out, net, owed, items waiting for review). Always call this before answering a money question.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  run: async () => {
    const l = await readLedger();
    return { ...l, summary: summarize(l) };
  },
});
