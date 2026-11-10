# Syncly Agent

A bookkeeper agent for solo builders, built on [Agent-Native](https://www.agent-native.com) for the Builder.io Agent-Native Hackathon.

Tell the agent in plain words what you spent, earned or need to bill. It logs the payments, picks categories, flags anything unusual, watches your budgets and drafts invoices. Nothing counts until you approve it on the board.

## What the agent does
- Logs payments from a chat message and files them under a category.
- Leaves a short note on anything that looks unusual.
- Drafts invoices. It never marks one sent; you do.
- Warns when a payment pushes a category over its monthly budget.
- Answers money questions from the live books (net, safe to spend, what to look at).

## What you control on the board (`/ledger`)
- Approve, reject or undo each payment; approve all at once.
- Change categories, add payments yourself, filter and search.
- Mark invoices sent, paid or void. Paid invoices land in the books.
- Set monthly budgets and the share of income to put aside for tax.

## One contract for both
The agent and the board call the same seven Agent-Native actions in `actions/`:
`list-ledger`, `add-transaction`, `update-transaction`, `approve-pending`, `draft-invoice`, `update-invoice`, `set-budget`.
Every agent change shows on the board within seconds, and every click is visible to the agent on its next read.

## Run it
```bash
corepack enable
pnpm install
echo "ANTHROPIC_API_KEY=your-key" > .env
pnpm dev
```
Open `/ledger`, then open the agent panel (top right) and try:
> I paid $29 for Figma today and got $400 from Dre for his booking site. Also bill George Okoro $650 for his portfolio, due Nov 25.

## Pre-existing work
The Syncly name and AI-CFO idea come from an earlier project of mine. This app was built new during the hackathon on the Agent-Native chat template; the books are demo data stored in `data/ledger.json`.

Slides: [DECK.md](DECK.md)
