import { useActionMutation, useActionQuery } from "@agent-native/core/client/hooks";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type Txn = {
  id: string; date: string; description: string; amount: number;
  direction: "in" | "out"; category: string;
  status: "pending" | "approved" | "rejected"; addedBy: "agent" | "you"; note?: string;
};
type Invoice = {
  id: string; client: string; description: string; amount: number; dueDate: string;
  status: "draft" | "sent" | "paid" | "void"; addedBy: "agent" | "you";
};
type Budget = { category: string; limit: number; spent: number; pending: number };

export function meta() {
  return [{ title: "Syncly - your books, kept by an agent you can overrule" }];
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const CATEGORIES = ["Client income", "Prizes", "Infrastructure", "AI and APIs", "Contractors", "Tax", "Other"];

const card = "rounded-2xl border border-[#e7e3da] bg-white";
const btn = "rounded-lg border border-[#d9d4c8] bg-white px-3 py-1.5 text-xs font-medium text-[#1c1b18] hover:bg-[#f3f1ea] disabled:opacity-50";
const btnPrimary = "rounded-lg bg-[#14532d] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#166534] disabled:opacity-50";
const input = "rounded-lg border border-[#d9d4c8] bg-white px-3 py-2 text-sm text-[#1c1b18] placeholder:text-[#9a958a] focus:outline-none focus:ring-2 focus:ring-[#14532d]/30";
const select = "rounded-lg border border-[#d9d4c8] bg-white px-2 py-1 text-xs text-[#1c1b18]";
const label = "text-[11px] font-medium uppercase tracking-wide text-[#8a8578]";

function Stat({ title, value, sub, tone }: { title: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className={`${card} p-4`}>
      <div className="text-xs text-[#6f6a5e]">{title}</div>
      <div className={`mt-1.5 text-[26px] font-semibold leading-none tabular-nums ${tone ?? "text-[#1c1b18]"}`}>{value}</div>
      {sub && <div className="mt-2 text-xs text-[#8a8578]">{sub}</div>}
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>{children}</span>;
}

export default function LedgerRoute() {
  const { setTheme } = useTheme();
  useEffect(() => { setTheme("light"); }, [setTheme]);

  const q = useActionQuery("list-ledger" as any, {} as any, { refetchInterval: 4000 } as any) as any;
  const updateTxn = useActionMutation("update-transaction" as any) as any;
  const addTxn = useActionMutation("add-transaction" as any) as any;
  const updateInv = useActionMutation("update-invoice" as any) as any;
  const approveAll = useActionMutation("approve-pending" as any) as any;
  const setBudget = useActionMutation("set-budget" as any) as any;
  const refresh = () => q.refetch?.();
  const run = (m: any, vars: any) => m.mutate(vars, { onSuccess: refresh });

  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"in" | "out">("out");
  const [category, setCategory] = useState("Other");
  const [filter, setFilter] = useState<"all" | "in" | "out" | "agent">("all");
  const [search, setSearch] = useState("");

  const data = q.data;
  if (!data) return <div className="min-h-full bg-[#f7f5ef] p-8 text-sm text-[#6f6a5e]">Loading your books...</div>;
  const txns: Txn[] = [...data.txns].sort((a: Txn, b: Txn) => b.date.localeCompare(a.date));
  const invoices: Invoice[] = data.invoices;
  const s = data.summary;
  const budgets: Budget[] = s.budgets;
  const pending = txns.filter((t) => t.status === "pending");
  const flow = s.moneyIn + s.moneyOut || 1;
  const shown = txns.filter((t) => {
    if (filter === "in" && t.direction !== "in") return false;
    if (filter === "out" && t.direction !== "out") return false;
    if (filter === "agent" && t.addedBy !== "agent") return false;
    if (search && !(t.description + " " + t.category).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-full bg-[#f7f5ef] text-[#1c1b18]">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className={label}>November 2026 · {data.currency}</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your books</h1>
            <p className="mt-1.5 max-w-xl text-sm text-[#6f6a5e]">
              Tell the agent what you spent, earned or need to bill. It keeps the books. Nothing counts until you approve it.
            </p>
          </div>
          <div className="rounded-2xl bg-[#14532d] px-5 py-4 text-white">
            <div className="text-xs text-white/70">Safe to spend</div>
            <div className="mt-1 text-3xl font-semibold leading-none tabular-nums">{fmt(s.safeToSpend)}</div>
            <div className="mt-2 text-xs text-white/70">after {Math.round(s.taxRate * 100)}% put aside for tax</div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat title="Money in" value={fmt(s.moneyIn)} tone="text-[#14532d]" sub={s.pendingIn ? `+${fmt(s.pendingIn)} waiting for approval` : "all approved"} />
          <Stat title="Money out" value={fmt(s.moneyOut)} sub={s.pendingOut ? `${fmt(s.pendingOut)} waiting for approval` : "all approved"} />
          <Stat title="Net" value={fmt(s.net)} tone={s.net >= 0 ? "text-[#14532d]" : "text-[#b42318]"} sub="approved payments only" />
          <Stat title="Owed to you" value={fmt(s.owedToYou)} sub={`${s.draftInvoices} draft invoice${s.draftInvoices === 1 ? "" : "s"} to review`} />
        </section>

        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between text-xs text-[#6f6a5e]">
            <span>In {fmt(s.moneyIn)}</span><span>Out {fmt(s.moneyOut)}</span>
          </div>
          <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-[#eeebe3]">
            <div className="bg-[#14532d]" style={{ width: `${(s.moneyIn / flow) * 100}%` }} />
            <div className="bg-[#d97706]" style={{ width: `${(s.moneyOut / flow) * 100}%` }} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Waiting for you <span className="ml-1 rounded-full bg-[#fde9c8] px-2 py-0.5 text-xs text-[#92400e]">{pending.length}</span></h2>
                {pending.length > 1 && <button className={btn} onClick={() => run(approveAll, {})}>Approve all</button>}
              </div>
              <div className={`${card} divide-y divide-[#efece4]`}>
                {pending.map((t) => (
                  <div key={t.id} className="flex flex-wrap items-center gap-3 p-3.5">
                    <div className={`h-9 w-1 rounded-full ${t.direction === "in" ? "bg-[#14532d]" : "bg-[#d97706]"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{t.description}</div>
                      <div className="mt-0.5 text-xs text-[#8a8578]">{day(t.date)} · logged by {t.addedBy === "agent" ? "the agent" : "you"}</div>
                      {t.note && <div className="mt-1.5 inline-block rounded-md bg-[#fff4e0] px-2 py-1 text-xs text-[#92400e]">Agent note: {t.note}</div>}
                    </div>
                    <select className={select} value={t.category} onChange={(e) => run(updateTxn, { id: t.id, category: e.target.value })}>
                      {[...new Set([t.category, ...CATEGORIES])].map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <div className={`w-24 text-right text-sm font-semibold tabular-nums ${t.direction === "in" ? "text-[#14532d]" : ""}`}>
                      {t.direction === "in" ? "+" : "-"}{fmt(t.amount)}
                    </div>
                    <button className={btnPrimary} onClick={() => run(updateTxn, { id: t.id, status: "approved" })}>Approve</button>
                    <button className={btn} onClick={() => run(updateTxn, { id: t.id, status: "rejected" })}>Reject</button>
                  </div>
                ))}
                {pending.length === 0 && <div className="p-5 text-sm text-[#6f6a5e]">All caught up. Nothing needs your approval.</div>}
              </div>
            </section>

            <section>
              <h2 className="mb-2.5 text-sm font-semibold">Invoices</h2>
              <div className={`${card} divide-y divide-[#efece4]`}>
                {invoices.map((i) => (
                  <div key={i.id} className="flex flex-wrap items-center gap-3 p-3.5">
                    <div className="grid size-9 place-items-center rounded-full bg-[#eef3ee] text-xs font-semibold text-[#14532d]">{i.client.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{i.client}</div>
                      <div className="mt-0.5 text-xs text-[#8a8578]">{i.description} · due {day(i.dueDate)}{i.addedBy === "agent" ? " · drafted by the agent" : ""}</div>
                    </div>
                    <Pill tone={i.status === "paid" ? "bg-[#dcf2e3] text-[#14532d]" : i.status === "sent" ? "bg-[#dbeafe] text-[#1e40af]" : i.status === "void" ? "bg-[#eeebe3] text-[#6f6a5e]" : "bg-[#fde9c8] text-[#92400e]"}>{i.status}</Pill>
                    <div className="w-24 text-right text-sm font-semibold tabular-nums">{fmt(i.amount)}</div>
                    {i.status === "draft" && <button className={btnPrimary} onClick={() => run(updateInv, { id: i.id, status: "sent" })}>Mark sent</button>}
                    {i.status === "sent" && <button className={btnPrimary} onClick={() => run(updateInv, { id: i.id, status: "paid" })}>Mark paid</button>}
                    {(i.status === "draft" || i.status === "sent") && <button className={btn} onClick={() => run(updateInv, { id: i.id, status: "void" })}>Void</button>}
                  </div>
                ))}
                {invoices.length === 0 && <div className="p-5 text-sm text-[#6f6a5e]">No invoices yet. Ask the agent to bill someone.</div>}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section>
              <h2 className="mb-2.5 text-sm font-semibold">Monthly budgets</h2>
              <div className={`${card} space-y-4 p-4`}>
                {budgets.map((b) => {
                  const used = b.spent + b.pending;
                  const over = used > b.limit;
                  return (
                    <div key={b.category}>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-medium">{b.category}</span>
                        <span className={`tabular-nums ${over ? "font-semibold text-[#b42318]" : "text-[#6f6a5e]"}`}>{fmt(used)} of {fmt(b.limit)}</span>
                      </div>
                      <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-[#eeebe3]">
                        <div className={over ? "bg-[#b42318]" : "bg-[#14532d]"} style={{ width: `${Math.min(100, (b.spent / b.limit) * 100)}%` }} />
                        <div className={over ? "bg-[#f1a9a0]" : "bg-[#9cc5a8]"} style={{ width: `${Math.min(100 - Math.min(100, (b.spent / b.limit) * 100), (b.pending / b.limit) * 100)}%` }} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-[#8a8578]">
                        <span>{over ? `Over by ${fmt(used - b.limit)}` : `${fmt(b.limit - used)} left`}{b.pending ? " · incl. pending" : ""}</span>
                        <span className="flex gap-1">
                          <button className="rounded border border-[#d9d4c8] px-1.5 hover:bg-[#f3f1ea]" aria-label={`Lower ${b.category} budget`} onClick={() => run(setBudget, { category: b.category, monthlyLimit: Math.max(10, b.limit - 10) })}>-10</button>
                          <button className="rounded border border-[#d9d4c8] px-1.5 hover:bg-[#f3f1ea]" aria-label={`Raise ${b.category} budget`} onClick={() => run(setBudget, { category: b.category, monthlyLimit: b.limit + 10 })}>+10</button>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            <section>
              <h2 className="mb-2.5 text-sm font-semibold">Put aside for tax</h2>
              <div className={`${card} p-4`}>
                <div className="text-2xl font-semibold tabular-nums">{fmt(s.taxSetAside)}</div>
                <div className="mt-1 text-xs text-[#8a8578]">{Math.round(s.taxRate * 100)}% of approved income</div>
                <div className="mt-3 flex gap-1.5">
                  {[0.05, 0.1, 0.15, 0.2].map((r) => (
                    <button key={r} className={Math.abs(s.taxRate - r) < 0.001 ? btnPrimary : btn} onClick={() => run(setBudget, { taxRate: r })}>{Math.round(r * 100)}%</button>
                  ))}
                </div>
              </div>
            </section>
          </aside>
        </div>

        <section>
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">All payments</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-[#d9d4c8] bg-white p-0.5 text-xs">
                {([["all", "All"], ["in", "Money in"], ["out", "Money out"], ["agent", "Logged by agent"]] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setFilter(k)} className={`rounded-md px-2.5 py-1 font-medium ${filter === k ? "bg-[#1c1b18] text-white" : "text-[#6f6a5e] hover:bg-[#f3f1ea]"}`}>{l}</button>
                ))}
              </div>
              <input className={`${input} w-44 py-1.5 text-xs`} placeholder="Search payments" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <form
            className={`${card} mb-3 flex flex-wrap gap-2 p-3`}
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(amount);
              if (!desc.trim() || !(n > 0)) return;
              run(addTxn, { description: desc.trim(), amount: n, direction, category, addedBy: "you" });
              setDesc(""); setAmount("");
            }}
          >
            <input className={`${input} min-w-0 flex-1`} placeholder="Add a payment yourself, e.g. Figma subscription" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <input className={`${input} w-28`} placeholder="Amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <select className={`${input} py-2`} value={direction} onChange={(e) => setDirection(e.target.value as any)}>
              <option value="out">Money out</option>
              <option value="in">Money in</option>
            </select>
            <select className={`${input} py-2`} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className={`${btnPrimary} px-4 text-sm`} type="submit">Add payment</button>
          </form>
          <div className={`${card} overflow-hidden`}>
            <table className="w-full text-sm">
              <thead className="border-b border-[#efece4] bg-[#fbfaf6] text-left">
                <tr>{["Date", "Payment", "Category", "Status"].map((h) => <th key={h} className={`${label} px-4 py-2.5`}>{h}</th>)}<th className={`${label} px-4 py-2.5 text-right`}>Amount</th><th className="w-10" /></tr>
              </thead>
              <tbody>
                {shown.map((t) => (
                  <tr key={t.id} className={`border-t border-[#efece4] first:border-t-0 ${t.status === "rejected" ? "text-[#a8a397] line-through" : ""}`}>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[#6f6a5e]">{day(t.date)}</td>
                    <td className="px-4 py-3 font-medium">{t.description}{t.addedBy === "agent" && <span className="ml-2 rounded bg-[#eef3ee] px-1.5 py-0.5 text-[10px] font-medium text-[#14532d] no-underline">agent</span>}</td>
                    <td className="px-4 py-3">
                      <select className={select} value={t.category} onChange={(e) => run(updateTxn, { id: t.id, category: e.target.value })}>
                        {[...new Set([t.category, ...CATEGORIES])].map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={t.status === "approved" ? "bg-[#dcf2e3] text-[#14532d]" : t.status === "pending" ? "bg-[#fde9c8] text-[#92400e]" : "bg-[#eeebe3] text-[#6f6a5e]"}>{t.status}</Pill>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${t.direction === "in" && t.status !== "rejected" ? "text-[#14532d]" : ""}`}>{t.direction === "in" ? "+" : "-"}{fmt(t.amount)}</td>
                    <td className="pr-3 text-right">
                      {t.status !== "pending" && <button className="text-xs text-[#8a8578] hover:text-[#1c1b18]" title="Send back for review" onClick={() => run(updateTxn, { id: t.id, status: "pending" })}>Undo</button>}
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-sm text-[#6f6a5e]">No payments match.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
