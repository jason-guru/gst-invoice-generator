import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { invoiceService, Invoice, InvoiceItem } from '../services/invoiceService'

export function useInvoices() {
  const { data: session } = useSession()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInvoices = useCallback(async () => {
    const userId = (session?.user as any)?.id
    if (!userId) return
    
    try {
      setLoading(true)
      setError(null)
      const userInvoices = await invoiceService.getUserInvoices(userId)
      setInvoices(userInvoices)
    } catch (error) {
      console.error('Error loading invoices:', error)
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  useEffect(() => {
    const userId = (session?.user as any)?.id
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
    const userId = (session?.user as any)?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    try {
      const newInvoice = await invoiceService.createInvoice(userId, invoiceData)
      setInvoices(prev => [newInvoice, ...prev])
      return newInvoice
    } catch (error) {
      console.error('Error creating invoice:', error)
      throw error
    }
  }

  const updateInvoice = async (invoiceId: string, updates: Partial<Invoice>): Promise<void> => {
    try {
      await invoiceService.updateInvoice(invoiceId, updates)
      setInvoices(prev => 
        prev.map(invoice => 
          invoice.id === invoiceId 
            ? { ...invoice, ...updates, updatedAt: new Date() }
            : invoice
        )
      )
    } catch (error) {
      console.error('Error updating invoice:', error)
      throw error
    }
  }

  const deleteInvoice = async (invoiceId: string): Promise<void> => {
    try {
      await invoiceService.deleteInvoice(invoiceId)
      setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId))
    } catch (error) {
      console.error('Error deleting invoice:', error)
      throw error
    }
  }

  return {
    invoices,
    loading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    refreshInvoices: loadInvoices
  }
}
