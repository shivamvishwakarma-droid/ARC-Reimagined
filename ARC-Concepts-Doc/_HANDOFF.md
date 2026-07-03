# ARC-FMS Prototypes — Session Handoff (2026-07-04)

Session id: 3715f99c-4df7-42be-b5c9-6f091dda41d2

## What this is
Clickable ARC-FMS concept prototypes (faithful ARC UI, VIBGYOR research data) + a detailed
walkthrough doc + a client-side JS data store. All on `~/Desktop/`, hosted locally at
`http://localhost:8765/` (run: `cd ~/Desktop && python3 -m http.server 8765`).

## Checkpoints (restore points)
`~/Desktop/_ARC-Checkpoints/checkpoint_2026-07-04_0006_pre-jsstore.zip`
Restore: `unzip -o <zip> -d ~/Desktop`

## Folders (siblings on Desktop)
- ARC-GILE-Concepts (5), ARC-Stats-Concepts (3), ARC-Institute-Management-Concepts (1),
  ARC-Transactions-Concepts (2), ARC-Reports-Concepts (1), ARC-Communications-Concepts (1),
  ARC-Bot-Concept (bot + dashboard-with-assistant), ARC-Bugs (verified bug + evidence xlsx),
  ARC-Data (store.js), ARC-Concepts-Doc (the doc).
- Main doc = `ARC-Concepts-Doc/ARC-FMS-Detailed-Walkthrough.html` (index.html redirects to it;
  old landing backed up as landing-catalog.html). FMS tree sidebar + scroll-spy + before/after.

## JS data store — `ARC-Data/store.js`  (window.ARCDB, localStorage key arc_fms_store_v3)
Seed: 14 VIBGYOR students, 6 fee headers, assignments + payments (PG/Offline/Auto-Debit/EMI + Failed).
Fixed TODAY=2026-07-04. Reconciles: collected ₹5,65,075 · pending ₹1,47,875 (fee-header sum == ledger).
API: students(), findStudent(q), student(id), collectionTotal({mode,cls,campus}), byMode(),
txnCount(), pendingTotal(), pendingCount(), defaulters(bucket '0'|'1'|'2'|'all'),
feeHeaderCollection(), studentLedger(id), studentPayments(id), recordPayment(...), sendReminder(id,ch),
reset(), inr(n), fmtDate(d).
Path from a screen 2-levels deep: `../../ARC-Data/store.js`; from ARC-Bot-Concept: `../ARC-Data/store.js`.

## WIRED to store (done)
- Bot (ARC-Bot-Concept/ARC-Assistant.html): findStudent + computed answers (pending, collected,
  by-mode, efficiency, "class N"). Student directory now includes dashboard students.
- Fee-Header Collection: KPIs + table.
- Defaulter Worklist: rows from defaulters(); sendReminder persists.
- Student Payment Lookup: timeline + KPIs from studentLedger + receipts.

## IN PROGRESS — "wire the whole thing" (NOT yet done)
1. **Custom Report** (ARC-Reports-Concepts/01-Custom-Report-Builder): make "Generate Report"
   actually build rows from ARCDB.payments()+student, filter by selected statuses(stats Set),
   Class/Location selects (lines 160-161), Paid date range (inputs lines 162-163), include only
   selected columns (sel Set, GROUPS at line 178), MERGE statuses into one sheet, and DOWNLOAD a CSV
   (Blob). Current generate is just toast() at line 171. Map the 30 column names → data values.
2. **Payment Reminder** (ARC-Stats-Concepts/03-Payment-Reminder): on setReminder() (line 256) show a
   POP-UP MODAL with metrics (recipients = ARCDB students in selected classes `cls` Set; if
   aud==='pend' filter to studentLedger(id).totals.pending>0; × slots × channels) + "payment links
   shared/scheduled" — instead of just toast. CLASSES at line 198.
3. **Dashboard EMI list** (ARC-Bot-Concept/ARC-Dashboard-With-Assistant.html): EMI array hardcoded.
   EMI *applications* (Denied/Withdrawn/Disbursed) are a different entity than store payments —
   either add an emiApplications seed to store, or leave with a note. Low priority.
4. **Fee-Breakup transactions** (ARC-Transactions-Concepts/01-Fee-Breakup-In-Transaction): TX array
   hardcoded; could bind to ARCDB.payments() (note: store payments are single-fee-header, so breakup
   is one row unless grouped by student+date).

## Other open items
- Bundle for hosting: put all folders under ONE root, keep relative paths, SCRUB real-ish student
  names before any PUBLIC host, zip → GitHub → Render (static site, publish dir = root, no build).
- DB (real): read replica creds in `~/.gq_db/*.cnf`; mysql at
  /usr/local/mysql-8.0.40-macos14-arm64/bin/mysql. SELECT-only. gq_migrate.
- Verified bug (real, keep GRD): Fee Header Report "Due Amount" sheet counts base fee as paid but
  Total Payable includes late fine → phantom pending = fine. 19,811 orders · ₹1.18 Cr. Evidence xlsx
  in ARC-Bugs/. Doc bug section has dashboard-vs-sheet before/after + Download Report (Excel) button.
