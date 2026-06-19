import { createContext, createElement, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { Invoice, InvoiceItem } from '../types/invoice'

// Invoices are accessed exclusively through authenticated API routes. The
// browser never talks to Firestore directly — the database denies all client
// access and all reads/writes run server-side via the Admin SDK.

// Dates arrive from the API as ISO strings; revive them into Date objects.
function reviveInvoice(raw: Record<string, unknown>): Invoice {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt as string),
    updatedAt: new Date(raw.updatedAt as string),
    invoiceDate: new Date(raw.invoiceDate as string),
  } as Invoice
}

export const PAGE_SIZE = 10

function useInvoicesState() {
  const { data: session } = useSession()
  // Key effects off the stable user id, not the session.user object. The object
  // reference changes whenever the session is re-fetched, which would otherwise
  // re-trigger a full reload of all invoices on every page view.
  const userId = (session?.user as { id?: string })?.id
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Fetch a single page from the server. Defaults to the current page, but
  // accepts an override so mutations can jump to a specific page atomically.
  const loadInvoices = useCallback(
    async (targetPage: number = page) => {
      if (!userId) return

      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/invoices?page=${targetPage}&pageSize=${PAGE_SIZE}`)
        if (!res.ok) throw new Error(`Failed to load invoices (${res.status})`)
        const data = (await res.json()) as {
          invoices: Record<string, unknown>[]
          total: number
        }
        setInvoices(data.invoices.map(reviveInvoice))
        setTotal(data.total)

        // If the page is now past the end (e.g. the last item on it was
        // deleted), step back to the last page that still has rows.
        const lastPage = Math.max(1, Math.ceil(data.total / PAGE_SIZE))
        if (targetPage > lastPage) setPage(lastPage)
      } catch (error) {
        console.error('Error loading invoices:', error)
        setError('Failed to load invoices')
      } finally {
        setLoading(false)
      }
    },
    [userId, page]
  )

  useEffect(() => {
    if (userId) {
      loadInvoices()
    } else {
      setLoading(false)
    }
  }, [userId, loadInvoices])

  const createInvoice = async (invoiceData: {
    invoiceNumber: string
    invoiceDate: Date

    supplierName: string
    supplierAddress: string
    supplierGSTIN: string

    recipientName: string
    recipientEmail?: string
    recipientAddress: string
    recipientCountry: string
    recipientCurrency: string

    fxRate: number
    lutId: string
    notes?: string
    items: InvoiceItem[]
  }): Promise<Invoice> => {
    const userId = (session?.user as { id?: string })?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    })
    if (!res.ok) {
      const message = await res.json().catch(() => ({}))
      console.error('Error creating invoice:', message)
      throw new Error(message.error || 'Failed to create invoice')
    }
    const newInvoice = reviveInvoice(await res.json())
    // New invoices are newest-first, so they land on page 1. Jump there and
    // reload from the server rather than splicing into the current page.
    if (page === 1) {
      await loadInvoices(1)
    } else {
      setPage(1)
    }
    return newInvoice
  }

  const updateInvoice = async (invoiceId: string, updates: Partial<Invoice>): Promise<void> => {
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      const message = await res.json().catch(() => ({}))
      console.error('Error updating invoice:', message)
      throw new Error(message.error || 'Failed to update invoice')
    }
    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === invoiceId
          ? { ...invoice, ...updates, updatedAt: new Date() }
          : invoice
      )
    )
  }

  const deleteInvoice = async (invoiceId: string): Promise<void> => {
    const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' })
    if (!res.ok) {
      const message = await res.json().catch(() => ({}))
      console.error('Error deleting invoice:', message)
      throw new Error(message.error || 'Failed to delete invoice')
    }
    // Reload the current page so the freed slot is backfilled from the next
    // page (and we drop back a page if this emptied the last one).
    await loadInvoices()
  }

  return {
    invoices,
    loading,
    error,
    page,
    setPage,
    total,
    totalPages,
    pageSize: PAGE_SIZE,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    refreshInvoices: loadInvoices,
  }
}

type InvoicesContextValue = ReturnType<typeof useInvoicesState>

const InvoicesContext = createContext<InvoicesContextValue | null>(null)

// Holds a single shared instance of the invoices state so the list is fetched
// once and reused across every component, instead of each consumer mounting its
// own copy of the hook and triggering a duplicate fetch.
export function InvoicesProvider({ children }: { children: ReactNode }) {
  const value = useInvoicesState()
  return createElement(InvoicesContext.Provider, { value }, children)
}

export function useInvoices() {
  const context = useContext(InvoicesContext)
  if (!context) {
    throw new Error('useInvoices must be used within an InvoicesProvider')
  }
  return context
}
