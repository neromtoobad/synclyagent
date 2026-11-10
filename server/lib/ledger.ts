import { promises as fs } from "node:fs";
import path from "node:path";

export type Txn = {
  id: string;
  date: string;
  description: string;
  amount: number;
  direction: "in" | "out";
  category: string;
  status: "pending" | "approved" | "rejected";
  addedBy: "agent" | "you";
  note?: string;
};
export type Invoice = {
  id: string;
  client: string;
  description: string;
  amount: number;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "void";
  addedBy: "agent" | "you";
};
export type Ledger = { currency: string; taxRate: number; budgets: Record<string, number>; txns: Txn[]; invoices: Invoice[] };

const FILE = path.join(process.cwd(), "data", "ledger.json");

const SEED: Ledger = {
  currency: "USDC",
  taxRate: 0.1,
  budgets: { Infrastructure: 120, "AI and APIs": 100, Contractors: 400, Other: 60 },
  txns: [
    { id: "t0", date: "2026-11-01", description: "Syncly Pay payout, October", amount: 640, direction: "in", category: "Client income", status: "approved", addedBy: "you" },
    { id: "t6", date: "2026-11-02", description: "Vercel Pro", amount: 20, direction: "out", category: "Infrastructure", status: "approved", addedBy: "you" },
    { id: "t7", date: "2026-11-05", description: "Voiceover and video credits", amount: 79, direction: "out", category: "AI and APIs", status: "approved", addedBy: "you" },
    { id: "t8", date: "2026-11-05", description: "Logo designer, fashion brand site", amount: 180, direction: "out", category: "Contractors", status: "approved", addedBy: "you" },
    { id: "t1", date: "2026-11-03", description: "Retainer, photographer portfolio", amount: 1200, direction: "in", category: "Client income", status: "approved", addedBy: "you" },
    { id: "t2", date: "2026-11-04", description: "Railway hosting", amount: 42.5, direction: "out", category: "Infrastructure", status: "approved", addedBy: "you" },
    { id: "t3", date: "2026-11-06", description: "Claude API credit", amount: 143.14, direction: "out", category: "AI and APIs", status: "pending", addedBy: "agent", note: "3x last month. Check the background worker." },
    { id: "t4", date: "2026-11-07", description: "Domain renewals (4)", amount: 51.8, direction: "out", category: "Infrastructure", status: "pending", addedBy: "agent" },
    { id: "t5", date: "2026-11-08", description: "Hackathon prize, 3rd place", amount: 1500, direction: "in", category: "Prizes", status: "pending", addedBy: "agent" },
  ],
  invoices: [
    { id: "i1", client: "Northside Films", description: "Portfolio site build", amount: 800, dueDate: "2026-11-20", status: "draft", addedBy: "agent" },
  ],
};

export async function readLedger(): Promise<Ledger> {
  try {
    const l = JSON.parse(await fs.readFile(FILE, "utf8")) as Ledger;
    l.budgets ??= { ...SEED.budgets };
    l.taxRate ??= SEED.taxRate;
    return l;
  } catch {
    await writeLedger(SEED);
    return structuredClone(SEED);
  }
}

export async function writeLedger(l: Ledger) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(l, null, 2));
}

export function newId(prefix: string) {
  return prefix + Math.random().toString(36).slice(2, 8);
}

export function summarize(l: Ledger) {
  const ok = l.txns.filter((t) => t.status === "approved");
  const moneyIn = ok.filter((t) => t.direction === "in").reduce((s, t) => s + t.amount, 0);
  const moneyOut = ok.filter((t) => t.direction === "out").reduce((s, t) => s + t.amount, 0);
  const byCategory: Record<string, number> = {};
  for (const t of ok.filter((t) => t.direction === "out"))
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  const owed = l.invoices.filter((i) => i.status === "sent").reduce((s, i) => s + i.amount, 0);
  const pend = l.txns.filter((t) => t.status === "pending");
  const taxSetAside = Math.round(moneyIn * l.taxRate * 100) / 100;
  const budgets = Object.entries(l.budgets).map(([category, limit]) => ({
    category,
    limit,
    spent: byCategory[category] ?? 0,
    pending: pend.filter((t) => t.direction === "out" && t.category === category).reduce((s, t) => s + t.amount, 0),
  }));
  return {
    taxRate: l.taxRate,
    taxSetAside,
    safeToSpend: Math.round((moneyIn - moneyOut - taxSetAside) * 100) / 100,
    pendingIn: pend.filter((t) => t.direction === "in").reduce((s, t) => s + t.amount, 0),
    pendingOut: pend.filter((t) => t.direction === "out").reduce((s, t) => s + t.amount, 0),
    budgets,
    overBudget: budgets.filter((b) => b.spent + b.pending > b.limit).map((b) => b.category),
    moneyIn,
    moneyOut,
    net: moneyIn - moneyOut,
    owedToYou: owed,
    waitingForReview: l.txns.filter((t) => t.status === "pending").length,
    draftInvoices: l.invoices.filter((i) => i.status === "draft").length,
    byCategory,
  };
}
