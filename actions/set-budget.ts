import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { readLedger, writeLedger } from "../server/lib/ledger";

export default defineAction({
  description:
    "Set the monthly spending limit for one category in Syncly (for example Infrastructure 120), or set the share of income to put aside for tax (taxRate, 0 to 0.5). The board shows each budget as a bar and turns it red when spending goes over.",
  schema: z.object({
    category: z.string().optional().describe("Category to set a monthly limit for"),
    monthlyLimit: z.number().nonnegative().optional().describe("Limit for that category; 0 removes the budget"),
    taxRate: z.number().min(0).max(0.5).optional().describe("Share of income to set aside for tax, e.g. 0.1"),
  }),
  run: async ({ category, monthlyLimit, taxRate }) => {
    const l = await readLedger();
    if (category && monthlyLimit !== undefined) {
      if (monthlyLimit === 0) delete l.budgets[category];
      else l.budgets[category] = monthlyLimit;
    }
    if (taxRate !== undefined) l.taxRate = taxRate;
    await writeLedger(l);
    return { budgets: l.budgets, taxRate: l.taxRate };
  },
});
