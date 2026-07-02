'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Invoice } from '../../../types/invoice'
import { InvoiceFormValues } from '../../../lib/invoiceUtils'
import InvoiceForm from '../../../components/invoices/InvoiceForm'

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">{label}</span>
    </div>
  )
}

// Maps an existing invoice onto the create form: everything is carried over
// except the invoice number (blank) and the date (today).
function invoiceToInitialValues(invoice: Invoice): Partial<InvoiceFormValues> {
  return {
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    supplierName: invoice.supplierName,
    supplierGSTIN: invoice.supplierGSTIN,
    supplierAddress: invoice.supplierAddress,
    recipientName: invoice.recipientName,
    recipientEmail: invoice.recipientEmail || '',
    recipientAddress: invoice.recipientAddress,
    recipientCountry: invoice.recipientCountry,
    recipientCurrency: invoice.recipientCurrency,
    fxRate: invoice.fxRate,
    lutId: invoice.lutId,
    items: invoice.items.map(item => ({ ...item })),
    notes: invoice.notes || '',
    supplierId: invoice.supplierId || '',
    clientId: invoice.clientId || '',
  }
}

function NewInvoiceContent() {
  const { data: session, status } = useSession()
  const copyFrom = useSearchParams().get('copyFrom')
  const [initialValues, setInitialValues] = useState<Partial<InvoiceFormValues> | null>(
    copyFrom ? null : {}
  )

  useEffect(() => {
    if (!copyFrom || !session) return
    let cancelled = false

    const loadSource = async () => {
      try {
        const res = await fetch(`/api/invoices/${copyFrom}`)
        if (!res.ok) throw new Error(`Failed to load invoice (${res.status})`)
        const invoice = (await res.json()) as Invoice
        if (!cancelled) setInitialValues(invoiceToInitialValues(invoice))
      } catch (error) {
        console.error('Error loading invoice to copy:', error)
        // Fall back to a blank form rather than blocking creation.
        if (!cancelled) setInitialValues({})
      }
    }

    loadSource()
    return () => {
      cancelled = true
    }
  }, [copyFrom, session])

  if (status === 'loading') {
    return <Spinner label="Loading..." />
  }

  if (!session) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">Please sign in to create an invoice</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Create New Invoice</h2>
      {initialValues === null ? (
        <Spinner label="Loading invoice to copy..." />
      ) : (
        <InvoiceForm initialValues={initialValues} />
      )}
    </div>
  )
}

export default function NewInvoicePage() {
  return (
    <div className="min-h-screen bg-gray-50 md:p-6">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-2xl shadow-xl">
        {/* useSearchParams requires a Suspense boundary for the build's
            prerender pass. */}
        <Suspense fallback={<Spinner label="Loading..." />}>
          <NewInvoiceContent />
        </Suspense>
      </div>
    </div>
  )
}
