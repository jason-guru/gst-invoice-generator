import { useState, useEffect, useCallback } from 'react'
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

export function useInvoices() {
  const { data: session } = useSession()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInvoices = useCallback(async () => {
    const userId = (session?.user as { id?: string })?.id
    if (!userId) return

    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/invoices')
      if (!res.ok) throw new Error(`Failed to load invoices (${res.status})`)
      const data = (await res.json()) as Record<string, unknown>[]
      setInvoices(data.map(reviveInvoice))
    } catch (error) {
      console.error('Error loading invoices:', error)
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  useEffect(() => {
    const userId = (session?.user as { id?: string })?.id
    if (userId) {
      loadInvoices()
    } else {
      setLoading(false)
    }
  }, [session?.user, loadInvoices])

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
    setInvoices((prev) => [newInvoice, ...prev])
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
    setInvoices((prev) => prev.filter((invoice) => invoice.id !== invoiceId))
  }

  return {
    invoices,
    loading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    refreshInvoices: loadInvoices,
  }
}
