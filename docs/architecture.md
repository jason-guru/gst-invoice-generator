# v2 Invoice App: New `/invoices` Section + Saved Clients/Suppliers (Old UI Untouched)

## Context

Supplier and recipient (client) details are free-text typed from scratch on every invoice, and creation happens in a modal inside `src/components/InvoiceList.tsx`. The goals:

1. Invoice creation on a dedicated page with pickers to select a saved client/supplier or enter a new one (new entries **auto-saved** on invoice create).
2. Management pages for clients and suppliers.
3. **The existing UI must not be touched**: `src/components/InvoiceList.tsx`, `src/app/page.tsx`, `src/app/page_new.tsx` stay byte-identical. The new version is built as entirely new files in a new **`/invoices`** section with **full feature parity** (list, pagination, copy, view modal with PDF/PNG download, edit, delete). Old `/` keeps working; both versions share the same backend and Firestore data. Copying code out of InvoiceList into new files is expected; modifying it is not. `src/app/layout.tsx` is the only legacy UI file edited (nav links).

Clients/suppliers don't exist as entities yet. Introduce them mirroring the existing 4-layer pattern: `src/services/invoiceAdminService.ts` → `src/app/api/invoices/route.ts` + `[id]/route.ts` → `src/hooks/useInvoices.ts` (context) → `src/components/Providers.tsx`. Firestore is Admin-SDK-only behind API routes (deny-all rules — no rules changes needed); every query scoped by `session.user.id`.

Line numbers below reference `InvoiceList.tsx` at HEAD `0e8a20d` (1093 lines).

## Key design decisions

- **Denormalized fields stay authoritative** on `Invoice`; add optional `clientId?` / `supplierId?` links. Old invoices and old UI untouched.
- **Auto-save server-side inside `POST /api/invoices`** — atomic, non-fatal (own try/catch, log only). Dedupe by case-insensitive trimmed name; create-only, never overwrite a saved entry.
- **No `orderBy` in new Firestore queries** — filter by `userId` only, sort in memory (avoids composite indexes; lists are small).
- **Picker UX**: plain Tailwind `<select>` — first option "New client…/New supplier…", then saved entries. Selecting fills still-editable fields; editing the *name* clears the selected id (name is the dedupe key). Hidden when the list is empty.
- **Copy flow**: navigate to `/invoices/new?copyFrom=<id>`; page fetches existing `GET /api/invoices/[id]` and prefills (blank number, today's date).
- Both pages share the singleton `useInvoices` provider, so list `page` state is shared between `/` and `/invoices` — acceptable, same data.

## Step 1 — Types

- **New `src/types/client.ts`**: `Client { id?, userId, name, email?, address, country, currency, createdAt, updatedAt }`
- **New `src/types/supplier.ts`**: `Supplier { id?, userId, name, address, gstin, createdAt, updatedAt }`
- **Edit `src/types/invoice.ts`**: add `clientId?: string; supplierId?: string` to `Invoice`.

## Step 2 — Services

New `src/services/clientAdminService.ts` (collection `'clients'`) and `src/services/supplierAdminService.ts` (collection `'suppliers'`), mirroring `invoiceAdminService.ts` (Timestamp round-trip converter, undefined-filtering on write, ownership checks; `import { adminDb } from '../../libs/firebaseAdmin'`):

- `getUserClients(userId)` — `where('userId','==',userId).get()`, in-memory `sort(name.localeCompare)`. **No `orderBy`.**
- `createClient / updateClient / deleteClient` — same shapes as invoice equivalents.
- `findByName(userId, name)` — fetch list, match `trim().toLowerCase()`.

## Step 3 — API routes

- **New `src/app/api/clients/route.ts`**: `GET` list, `POST` create (require `name`; whitelist `name, email, address, country, currency`). Copy session-check pattern from `api/invoices/route.ts`.
- **New `src/app/api/clients/[id]/route.ts`**: `PUT` + `DELETE`, copying the awaited-`params` pattern from `api/invoices/[id]/route.ts`.
- **Same pair for suppliers** (whitelist `name, address, gstin`).
- **Edit `src/app/api/invoices/route.ts` POST — auto-save**: after validation, before `createInvoice`: if no `supplierId` in body and `supplierName` non-empty → `supplierAdminService.findByName`; reuse existing id or create new and take its id. Same for `clientId` from `recipientName/Email/Address/Country/Currency`. Each in its own try/catch (`console.error` only — a failed auto-save must not fail invoice creation). Include resulting `supplierId, clientId` in `invoiceData` (createInvoice already filters undefined).

## Step 4 — Hooks + Providers

- **New `src/hooks/useClients.ts` / `src/hooks/useSuppliers.ts`**, mirroring `useInvoices.ts` without pagination (keep the `createElement` context trick — `.ts` files). Expose `{ clients|suppliers, loading, error, create, update, delete, refresh }`.
- **Edit `src/components/Providers.tsx`**: nest `ClientsProvider` + `SuppliersProvider` inside `InvoicesProvider`.
- **Edit `src/hooks/useInvoices.ts`**: extend `createInvoice` param type with optional `clientId` / `supplierId` (body already `JSON.stringify(invoiceData)` — no other change).

## Step 5 — Shared helpers (copied, not moved, from InvoiceList)

**New `src/lib/invoiceUtils.ts`:**

- `toWords(num)` — verbatim from lines 43–76 (INR → words, Indian grouping, rupees/paise)
- `invoiceTotalINR(inv)` — the `items.reduce((acc,i) => acc + i.amount * fxRate, 0)` from 367/526/531
- `formatInvoiceDate(d)` — string-guarded `toLocaleDateString('en-GB')` from 476/495
- `timestampSlug()` — from 96/106
- `downloadElementAsPdf(el)` / `downloadElementAsPng(el)` — generalized from 78–99 / 101–111. **Import `html2canvas` from `'html2canvas-pro'`, never `'html2canvas'`** (both are in package.json; only -pro handles Tailwind v4 oklch colors). PDF: `new jsPDF('p','pt','a4')`, 20pt margin, fit-ratio `Math.min`, centered horizontally.
- `emptyInvoiceFormValues()` + `InvoiceFormValues` type — initial createFormData shape (lines 22–37: blank fields, `invoiceDate: new Date().toISOString().slice(0,10)`, `recipientCurrency:'USD'`, `fxRate:86.50`, one empty item) extended with `supplierId:''`, `clientId:''`.

**New `src/lib/invoiceAssets.ts`**: `export const authorizedSignature = "data:image/jpeg;base64,..."` — the ~9KB constant from line 113, byte-for-byte.

## Step 6 — New components in `src/components/invoices/`

- **`InvoicePrintView.tsx`** — props `{ invoice, ref }` (React 19 ref-as-prop). Verbatim port of lines 463–547. **Pixel parity mandatory** — preserve intentional quirks: hard-coded "Country: Brazil", "Currency: USD", "POS: 96 – Foreign Country", "Recipient GSTIN: URP", "Reverse Charge: No"; the `width-full` typo class; `border-2 border-dashed rounded-2xl` frame; curly quotes in the Rule 96A line; `<pre className="whitespace-pre-line text-sm">` addresses; `next/image` signature (`width={100} height={50} className="rounded-full mr-10"`). Do not "fix" these.
- **`InvoiceViewModal.tsx`** — props `{ invoice, onClose }`. Owns `printRef`; modal shell from 448–462 + download buttons 549–557 calling `downloadElementAsPdf/Png(printRef.current!)`. Capture target stays visible on-screen (html2canvas can't capture hidden nodes).
- **`InvoiceEditModal.tsx`** — props `{ invoice, onClose, onSave }`. State `formData` (init `{...invoice, items: invoice.items.map(i=>({...i}))}` — deep-copy items, fixing line 122's aliasing) + `saving`. Handlers from 145–189, JSX from 571–831. Keep edit semantics: amount directly editable, no min-1 item guard, Remove always shown.
- **`InvoiceTable.tsx`** — props `{ invoices, deletingId, onView, onEdit, onCopy, onDelete }`. Real `<table>` (Invoice #, Client, Date, Total INR, Items, Actions) in `overflow-x-auto` — structural improvement allowed; feature set ported from card grid 346–412 (totals via `invoiceTotalINR`, `formatDistanceToNow` created-ago, per-row "Deleting…" state, blue/green/purple/red action buttons). Includes empty state (337–344).
- **`Pagination.tsx`** — props `{ page, totalPages, onPageChange }`; verbatim port of 414–445 (null when `totalPages <= 1`; active page `bg-teal-600 border-teal-600 text-white`).
- **`SavedEntitySelect.tsx`** — props `{ label, newLabel, options: {id,name}[], selectedId, onChange }`; field classes `mt-1 block w-full border border-gray-300 rounded-md px-3 py-2`; first option `''` = newLabel; renders nothing when options empty.
- **`InvoiceForm.tsx`** (`'use client'`) — props `{ initialValues? }`. State `{...emptyInvoiceFormValues(), ...initialValues}` + `saving`. Handlers ported from 205–285 (create semantics: `amount = rate * quantity` auto-calc on rate/quantity change, readOnly amount field, min-1 item guard). JSX from create modal body 846–1069 + buttons 1072–1086, as a page card (no overlay). Supplier section: `SavedEntitySelect` (from `useSuppliers()`) above the 3 supplier fields — select fills name/GSTIN/address + sets `supplierId`; editing `supplierName` resets `supplierId:''`. Recipient section: same with `useClients()` over the 5 recipient fields → `clientId`. Submit: `createInvoice({...payload per 243–258, invoiceDate: new Date(...), supplierId: supplierId || undefined, clientId: clientId || undefined})`, fire-and-forget `refreshClients()`/`refreshSuppliers()`, `router.push('/invoices')`. Cancel → `/invoices`.

## Step 7 — Pages + nav

- **New `src/app/invoices/page.tsx`** (`'use client'`): lifts `viewingInvoice`/`editingInvoice`/`deletingId`; uses `useInvoices()`. Port sign-in guard (287–293), loading (295–305), error (307–313), header (317–333) with Create button as `<Link href="/invoices/new">` styled identically (`bg-teal-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-lg ml-3`). Composes `InvoiceTable` (onCopy → `router.push('/invoices/new?copyFrom='+id)`; onDelete = confirm + `deleteInvoice` per 191–203), `Pagination` (`onPageChange={setPage}`), `InvoiceViewModal`, `InvoiceEditModal` (onSave = `updateInvoice`). Page chrome: `min-h-screen bg-gray-50 md:p-6` + `max-w-5xl mx-auto bg-white p-6 rounded-2xl shadow-xl`. No `next/head`.
- **New `src/app/invoices/new/page.tsx`** (`'use client'`): default export wraps inner component in **`<Suspense>` (required — `useSearchParams` without it fails `npm run build` on Next 16)**. Inner: session guard; `copyFrom` param → fetch `/api/invoices/${copyFrom}`, build `initialValues` per handleCopy's field list (125–143: blank invoiceNumber, today's date, `recipientEmail || ''`, `notes || ''`, deep-copied items, carry `clientId`/`supplierId`); spinner until loaded; mount `<InvoiceForm>` only after fetch resolves (or key on `copyFrom`).
- **New `src/app/clients/page.tsx`** (`'use client'`): session guard; table Name, Email, Country, Currency, Actions; "Add Client" button + shared add/edit modal (modal shell pattern from InvoiceList 835–845); delete via `window.confirm('Delete this client? Existing invoices are not affected.')`; empty state "No saved clients yet. Clients are saved automatically when you create an invoice." Backed by `useClients()`.
- **New `src/app/suppliers/page.tsx`**: same, columns Name, GSTIN, Address.
- **Edit `src/app/layout.tsx`** (only legacy UI file touched): desktop block (lines 24–37) — after the `/rcm` Link add `Invoices` → `/invoices`, `Clients` → `/clients`, `Suppliers` → `/suppliers` with the `/rcm` classes (`text-gray-700 hover:bg-gray-50 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors`); mobile block (44–58) — same three with the compact classes from line 54.

## Implementation order + verification

1. Steps 1–4 (backend). `npx tsc --noEmit` + `npm run lint`.
2. Step 5 (lib) + Step 6 components; then `/invoices` page + nav. **Checkpoint A** (`npm run dev`, sign in): `/invoices` lists same invoices as `/`; pagination; View → download PDF + PNG and visually compare with the same invoice's PDF from `/` (must be identical); Edit + save reflects on both pages; Delete with confirm.
3. `/invoices/new`. **Checkpoint B**: create with brand-new supplier + client → redirect to `/invoices`, invoice on page 1 of both lists; `/clients` + `/suppliers` (once built) show auto-saved entries; second invoice via pickers → fields fill, **no duplicates**; same-name manual entry → still no duplicate; copy from `/invoices` → prefilled, blank number, today's date; items add/remove + rate×qty auto-calc.
4. `/clients` + `/suppliers` pages. **Checkpoint C**: list/edit/delete saved entries; pickers reflect changes; deleting a supplier leaves invoices intact.
5. Regression: `git diff --stat` shows **zero changes** to `src/components/InvoiceList.tsx`, `src/app/page.tsx`, `src/app/page_new.tsx`; old `/` fully functional (its create modal included); `/rcm` untouched; `npm run build` passes (Suspense check).

## Risks / gotchas

- **html2canvas-pro only** — plain `html2canvas` throws on Tailwind v4 oklch colors; both packages are installed, the wrong import compiles fine and breaks at runtime.
- Signature constant must be copied byte-for-byte (~9KB base64); truncation corrupts the PDF signature.
- Replicate modal overlay classes verbatim (`bg-black bg-opacity-50` is v3 syntax — whatever it renders today, keep identical).
- `parseFloat`/`parseInt` NaN behavior on cleared number inputs is existing behavior — port as-is or add `|| 0`; either fine.
- Dedupe is name-only: two distinct clients with the same name collapse into one saved entry (invoices keep their own denormalized values — no data loss).
- No `orderBy` on the new userId-filtered queries, or Firestore 500s until a composite index exists.
