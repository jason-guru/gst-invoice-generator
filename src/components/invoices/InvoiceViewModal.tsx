'use client'

import { useRef } from 'react'
import { Invoice } from '../../types/invoice'
import { downloadElementAsPdf, downloadElementAsPng } from '../../lib/invoiceUtils'
import InvoicePrintView from './InvoicePrintView'

// View modal: shows the printable invoice and offers PDF/PNG downloads. The
// downloads capture the on-screen markup, so the print view must stay mounted
// and visible while the modal is open.
export default function InvoiceViewModal({
  invoice,
  onClose,
}: {
  invoice: Invoice
  onClose: () => void
}) {
  const printRef = useRef<HTMLDivElement>(null)

  const downloadPdf = async () => {
    if (printRef.current) {
      await downloadElementAsPdf(printRef.current)
    }
  }

  const downloadPng = async () => {
    if (printRef.current) {
      await downloadElementAsPng(printRef.current)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl max-h-[100vh] overflow-y-auto w-full">
        <div className="flex justify-between items-center p-1 px-4 border-b">
          <h3 className="text-lg font-semibold">Invoice Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1">
            <InvoicePrintView invoice={invoice} ref={printRef} />
            <div className="text-center mt-6">
              <button onClick={downloadPdf} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-2xl shadow-lg mr-4">
                Download Invoice PDF
              </button>
              <button onClick={downloadPng} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-2xl shadow-lg">
                Download Invoice PNG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
