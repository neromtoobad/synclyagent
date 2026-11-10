import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { readLedger, writeLedger } from "../server/lib/ledger";

export default defineAction({
  description:
    "Change one transaction in the Syncly books: fix its category, amount, description or note, or set its status to approved, rejected or pending. Only approve or reject when the owner asks.",
  schema: z.object({
    id: z.string(),
    description: z.string().optional(),
    amount: z.number().positive().optional(),
    category: z.string().optional(),
    note: z.string().optional(),
    status: z.enum(["pending", "approved", "rejected"]).optional(),
  }),
  run: async ({ id, ...patch }) => {
    const l = await readLedger();
    const t = l.txns.find((x) => x.id === id);
    if (!t) return { error: `No transaction with id ${id}` };
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) (t as any)[k] = v;
    await writeLedger(l);
    return t;
  },
});
