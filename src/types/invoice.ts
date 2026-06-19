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
  lutId: string
  notes?: string
  items: InvoiceItem[]
  createdAt: Date
  updatedAt: Date
}
