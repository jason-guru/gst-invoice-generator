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

  // Optional links to the user's saved supplier/client entries. The
  // denormalized supplier*/recipient* fields above remain authoritative —
  // editing or deleting a saved entry never changes existing invoices.
  supplierId?: string
  clientId?: string

  fxRate: number
  lutId: string
  notes?: string
  items: InvoiceItem[]
  createdAt: Date
  updatedAt: Date
}
