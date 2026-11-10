import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { newId, readLedger, writeLedger } from "../server/lib/ledger";

export default defineAction({
  description:
    "Draft an invoice for a client in Syncly. It is saved as a draft; the owner reviews it and marks it sent. Never mark an invoice sent yourself.",
  schema: z.object({
    client: z.string(),
    description: z.string().describe("What the invoice is for"),
    amount: z.number().positive(),
    dueDate: z.string().describe("YYYY-MM-DD"),
  }),
  run: async (a) => {
    const l = await readLedger();
    const inv = { id: newId("i"), ...a, status: "draft" as const, addedBy: "agent" as const };
    l.invoices.push(inv);
    await writeLedger(l);
    return inv;
  },
});
