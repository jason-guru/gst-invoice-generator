'use client'

import { formatDistanceToNow } from 'date-fns'
import { Invoice } from '../../types/invoice'
import { invoiceTotalINR } from '../../lib/invoiceUtils'

export default function InvoiceTable({
  invoices,
  deletingId,
  onView,
  onEdit,
  onCopy,
  onDelete,
}: {
  invoices: Invoice[]
  deletingId: string | null
  onView: (invoice: Invoice) => void
  onEdit: (invoice: Invoice) => void
  onCopy: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
}) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating your first invoice above.</p>
      </div>
    )
  }

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm border">
        <thead className="bg-gray-100 font-semibold">
          <tr>
            <th className="p-2 border text-left">Invoice #</th>
            <th className="p-2 border text-left">Client</th>
            <th className="p-2 border text-left">Date</th>
            <th className="p-2 border text-right">Total (INR)</th>
            <th className="p-2 border text-right">Items</th>
            <th className="p-2 border text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50">
              <td className="p-2 border">
                <span className="font-semibold text-gray-900">{invoice.invoiceNumber}</span>
                <p className="text-xs text-gray-400">
                  Created {formatDistanceToNow(invoice.createdAt, { addSuffix: true })}
                </p>
              </td>
              <td className="p-2 border">
                <span className="font-medium text-gray-700">{invoice.recipientName}</span>
                {invoice.recipientEmail && (
                  <p className="text-xs text-gray-500">{invoice.recipientEmail}</p>
                )}
              </td>
              <td className="p-2 border text-gray-500">
                {new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}
              </td>
              <td className="p-2 border text-right font-bold text-gray-900">
                ₹{invoiceTotalINR(invoice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </td>
              <td className="p-2 border text-right text-gray-500">
                {invoice.items.length}
              </td>
              <td className="p-2 border text-center whitespace-nowrap">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => onView(invoice)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEdit(invoice)}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onCopy(invoice)}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => onDelete(invoice)}
                    disabled={deletingId === invoice.id}
                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                  >
                    {deletingId === invoice.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
