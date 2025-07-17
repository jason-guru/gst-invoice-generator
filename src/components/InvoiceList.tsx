'use client'

import { useInvoices } from '../hooks/useInvoices'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'

export default function InvoiceList() {
  const { data: session } = useSession()
  const { invoices, loading, error } = useInvoices()

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
          {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first invoice above.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-700 font-medium">{invoice.clientName}</p>
                  {invoice.clientEmail && (
                    <p className="text-sm text-gray-500">{invoice.clientEmail}</p>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    <span>Issue Date: {invoice.issueDate.toLocaleDateString()}</span>
                    {invoice.dueDate && (
                      <span>Due: {invoice.dueDate.toLocaleDateString()}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Created {formatDistanceToNow(invoice.createdAt, { addSuffix: true })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{invoice.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View
                    </button>
                    <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
              
              {invoice.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {invoice.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
