import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { readLedger, writeLedger } from "../server/lib/ledger";

export default defineAction({
  description:
    "Approve several pending Syncly payments at once. With no arguments it approves every pending payment. Use maxAmount to approve only small ones (for example everything under 100) and leave the rest for the owner. Only call this when the owner asks.",
  schema: z.object({
    maxAmount: z.number().positive().optional().describe("Only approve payments at or below this amount"),
    ids: z.array(z.string()).optional().describe("Only approve these transaction ids"),
  }),
  run: async ({ maxAmount, ids }) => {
    const l = await readLedger();
    const done: string[] = [];
    for (const t of l.txns) {
      if (t.status !== "pending") continue;
      if (ids && !ids.includes(t.id)) continue;
      if (maxAmount !== undefined && t.amount > maxAmount) continue;
      t.status = "approved";
      done.push(t.description);
    }
    await writeLedger(l);
    return { approved: done, stillPending: l.txns.filter((t) => t.status === "pending").length };
  },
});
