'use client'

import { Ref } from 'react'
import Image from 'next/image'
import { Invoice } from '../../types/invoice'
import { toWords, invoiceTotalINR, formatInvoiceDate } from '../../lib/invoiceUtils'
import { authorizedSignature } from '../../lib/invoiceAssets'

// The printable invoice. This markup is captured by html2canvas for the
// PDF/PNG downloads, so it must stay visually identical to the legacy view in
// InvoiceList.tsx — including its hard-coded declarations and quirks (Country/
// Currency labels, POS 96, the `width-full` class). Do not "fix" those here
// without changing the legacy copy in the same way.
export default function InvoicePrintView({
  invoice,
  ref,
}: {
  invoice: Invoice
  ref: Ref<HTMLDivElement>
}) {
  return (
    <div ref={ref} id="invoice" className="border-2 border-dashed p-6 rounded-2xl scale-100 width-full md:scale-100">
      <h2 className="text-xl font-bold text-center mb-4">TAX INVOICE</h2>
      <p className="text-center italic mb-6">(Export of Services under LUT – IGST Not Payable)</p>
      <div className="grid grid-cols-1 grid-cols-2 gap-4 text-sm">
        <div>
          <h3 className="font-semibold">Supplier (Exporter)</h3>
          <p>{invoice.supplierName}</p>
          <pre className="whitespace-pre-line text-sm">{invoice.supplierAddress}</pre>
          <p>GSTIN: {invoice.supplierGSTIN}</p>
        </div>
        <div>
          <h3 className="font-semibold">Invoice Details</h3>
          <p>No.: {invoice.invoiceNumber}</p>
          <p>Date: {formatInvoiceDate(invoice.invoiceDate)}</p>
          <p>POS: 96 – Foreign Country</p>
          <p>Reverse Charge: No</p>
        </div>
      </div>
      <p className='text-sm mt-4 text-gray-600'>Letter of Undertaking (LUT) No.: {invoice.lutId}</p>
      <p className='text-sm text-gray-600'>Export Declaration (Rule 96A): “Supply meant for export under LUT without
      payment of integrated tax.”</p>
      <div className="grid grid-cols-1 grid-cols-2 gap-4 text-sm mt-4">
        <div>
          <h3 className="font-semibold">Recipient (Foreign Client)</h3>
          <p className='mb-0 pb-0'>{invoice.recipientName}</p>
          <pre className="whitespace-pre-line text-sm">{invoice.recipientAddress}</pre>
        </div>

        <div>
          <h3 className="font-semibold">Recipient GSTIN: URP</h3>
          <p>Country: Brazil</p>
          <p>Currency: USD</p>
          <p>Conversion Rate (RBI TT-Selling): 1 USD = ₹{invoice.fxRate} ({formatInvoiceDate(invoice.invoiceDate)})</p>
        </div>
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full mt-6 text-sm border">
          <thead className="bg-gray-100 font-semibold">
            <tr>
              <th className="p-2 border">S No</th>
              <th className="p-2 border">Description</th>
              <th className="p-2 border">HSN</th>
              <th className="p-2 border text-right">Amount (USD)</th>
              <th className="p-2 border text-right">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => {
              const amountINR = item.amount * invoice.fxRate;
              return (
                <tr key={index}>
                  <td className="p-2 border">{index + 1}</td>
                  <td className="p-2 border">{item.description}</td>
                  <td className="p-2 border">{item.hsn}</td>
                  <td className="p-2 border text-right">{'$' + item.amount.toFixed(2)}</td>
                  <td className="p-2 border text-right">{'₹' + amountINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="font-semibold">
            <tr>
              <td colSpan={4} className="p-2 border text-right">Invoice Total (INR)</td>
              <td className="p-2 border text-right">{'₹' + invoiceTotalINR(invoice).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-4 text-sm"><strong>Amount in words:</strong> {toWords(invoiceTotalINR(invoice))} only</p>
      <p className="mt-8 text-sm">* This supply is zero-rated under Section 16 of the IGST Act 2017 under LUT without payment of tax.</p>
      <div className="mt-10 text-right">
        <div className='flex flex-col items-end'>
          <Image
            src={authorizedSignature}
            alt="Signature"
            width={100}
            height={50}
            className="rounded-full mr-10"
          />
        </div>

        <p>For {invoice.supplierName}</p>
        <p className="italic">Authorised Signatory</p>
      </div>
    </div>
  )
}
