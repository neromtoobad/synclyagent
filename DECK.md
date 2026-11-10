# Syncly Agent
### Your books, kept by an agent you can overrule
Builder.io Agent-Native Hackathon · built on Agent-Native

---

## 1. The problem
Solo builders run a business from chat threads and bank alerts.
Bookkeeping happens weeks late, invoices go unsent, and nobody notices a bill that tripled.

---

## 2. The idea
Say it once, in plain words:

> "I paid $29 for Figma and got $400 from Dre. Bill George $650, due Nov 25."

The agent does the bookkeeping. You stay the one who signs off.

---

## 3. What the agent does
- Logs each payment and picks its category
- Flags what looks unusual, with a one-line reason
- Drafts invoices, never sends them
- Watches monthly budgets and the tax set-aside
- Answers "what can I afford?" from the live numbers

---

## 4. What you control
- Approve, reject, undo, or approve all
- Fix categories and amounts
- Mark invoices sent and paid
- Set budgets and the tax rate
- Nothing counts toward your totals until you approve it

---

## 5. How it uses Agent-Native
Seven actions, one contract for the agent and the UI:

`list-ledger` · `add-transaction` · `update-transaction` · `approve-pending` · `draft-invoice` · `update-invoice` · `set-budget`

The board reads and writes through the same actions the agent calls, so both always see the same books.

---

## 6. What's next
- Read real payments from a wallet or bank feed
- Send invoices and collect in USDC
- Monthly close: the agent prepares it, you sign it
