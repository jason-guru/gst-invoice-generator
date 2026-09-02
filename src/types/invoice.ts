export interface InvoiceItem {
  description: string
  hsn: string
  quantity: number
  rate: number
  amount: number
}

export interface Invoice {
  id?: string
  userId: string
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
  // Actual publication date of the fetched USD/INR rate (YYYY-MM-DD). May be
  // earlier than invoiceDate when the rate for that day was unavailable.
  fxRateDate?: string
  lutId: string
  notes?: string
  items: InvoiceItem[]
  createdAt: Date
  updatedAt: Date
}
