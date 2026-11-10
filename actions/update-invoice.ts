import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { newId, readLedger, writeLedger } from "../server/lib/ledger";

export default defineAction({
  description:
    "Change one invoice in Syncly: edit its amount, due date or description, or set its status to draft, sent, paid or void. Marking it paid also logs the money received in the books.",
  schema: z.object({
    id: z.string(),
    description: z.string().optional(),
    amount: z.number().positive().optional(),
    dueDate: z.string().optional(),
    status: z.enum(["draft", "sent", "paid", "void"]).optional(),
  }),
  run: async ({ id, ...patch }) => {
    const l = await readLedger();
    const inv = l.invoices.find((x) => x.id === id);
    if (!inv) return { error: `No invoice with id ${id}` };
    const wasPaid = inv.status === "paid";
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) (inv as any)[k] = v;
    if (!wasPaid && inv.status === "paid") {
      l.txns.push({
        id: newId("t"),
        date: new Date().toISOString().slice(0, 10),
        description: `Invoice paid, ${inv.client}`,
        amount: inv.amount,
        direction: "in",
        category: "Client income",
        status: "approved",
        addedBy: "you",
      });
    }
    await writeLedger(l);
    return inv;
  },
});
