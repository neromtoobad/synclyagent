import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { newId, readLedger, writeLedger } from "../server/lib/ledger";

export default defineAction({
  description:
    "Log a payment in the Syncly books. Use direction 'in' for money received and 'out' for money spent. Pick a short category (Client income, Infrastructure, AI and APIs, Prizes, Contractors, Tax, Other). Entries added by the agent start as 'pending' so the owner can approve them. Add a note when something looks unusual.",
  schema: z.object({
    description: z.string().describe("What the payment was for"),
    amount: z.number().positive().describe("Amount, always positive"),
    direction: z.enum(["in", "out"]),
    category: z.string().default("Other"),
    date: z.string().optional().describe("YYYY-MM-DD, defaults to today"),
    note: z.string().optional().describe("Why this needs the owner's attention"),
    addedBy: z.enum(["agent", "you"]).default("agent"),
  }),
  run: async (a) => {
    const l = await readLedger();
    const txn = {
      id: newId("t"),
      date: a.date ?? new Date().toISOString().slice(0, 10),
      description: a.description,
      amount: a.amount,
      direction: a.direction,
      category: a.category,
      status: a.addedBy === "you" ? ("approved" as const) : ("pending" as const),
      addedBy: a.addedBy,
      note: a.note,
    };
    l.txns.push(txn);
    await writeLedger(l);
    return txn;
  },
});
