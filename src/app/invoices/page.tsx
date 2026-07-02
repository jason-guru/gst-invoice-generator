'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useInvoices } from '../../hooks/useInvoices'
import { Invoice } from '../../types/invoice'
import InvoiceTable from '../../components/invoices/InvoiceTable'
import Pagination from '../../components/invoices/Pagination'
import InvoiceViewModal from '../../components/invoices/InvoiceViewModal'
import InvoiceEditModal from '../../components/invoices/InvoiceEditModal'

export default function InvoicesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { invoices, loading, error, page, setPage, total, totalPages, pageSize, deleteInvoice, updateInvoice } = useInvoices()
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Pagination is driven by the server; `invoices` already holds just this page.
  const pageStart = (page - 1) * pageSize

  const handleCopy = (invoice: Invoice) => {
    router.push(`/invoices/new?copyFrom=${invoice.id}`)
  }

  const handleDelete = async (invoice: Invoice) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        setDeletingId(invoice.id!)
        await deleteInvoice(invoice.id!)
      } catch (error) {
        console.error('Error deleting invoice:', error)
        alert('Failed to delete invoice. Please try again.')
      } finally {
        setDeletingId(null)
      }
    }
  }

  const renderContent = () => {
    if (!session) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">Please sign in to view your saved invoices</p>
        </div>
      )
    }

    if (loading) {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Invoices</h2>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading invoices...</span>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Your Invoices</h2>
          <div className="text-sm text-gray-500">
            {total} invoice{total !== 1 ? 's' : ''}
            {total > 0 && (
              <span className="ml-2">
                (Showing {pageStart + 1}–{pageStart + invoices.length} of {total})
              </span>
            )}
            <Link
              href="/invoices/new"
              className="inline-block bg-teal-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-lg ml-3"
            >
              Create New Invoice
            </Link>
          </div>
        </div>

        <InvoiceTable
          invoices={invoices}
          deletingId={deletingId}
          onView={setViewingInvoice}
          onEdit={setEditingInvoice}
          onCopy={handleCopy}
          onDelete={handleDelete}
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {viewingInvoice && (
          <InvoiceViewModal
            invoice={viewingInvoice}
            onClose={() => setViewingInvoice(null)}
          />
        )}

        {editingInvoice && (
          <InvoiceEditModal
            invoice={editingInvoice}
            onClose={() => setEditingInvoice(null)}
            onSave={updateInvoice}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 md:p-6">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-2xl shadow-xl">
        {renderContent()}
      </div>
    </div>
  )
}
