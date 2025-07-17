import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  FieldValue 
} from 'firebase/firestore'
import { db } from '../../libs/firebase'

export interface InvoiceItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface Invoice {
  id?: string
  userId: string
  invoiceNumber: string
  clientName: string
  clientEmail?: string
  clientAddress?: string
  issueDate: Date
  dueDate?: Date
  subtotal: number
  tax: number
  total: number
  status: 'draft' | 'sent' | 'paid'
  notes?: string
  items: InvoiceItem[]
  createdAt: Date
  updatedAt: Date
}

export const invoiceService = {
  // Create invoice
  async createInvoice(userId: string, invoiceData: Omit<Invoice, 'id' | 'userId' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'status'> & { status?: 'draft' | 'sent' | 'paid' }): Promise<Invoice> {
    const invoice: Omit<Invoice, 'id'> = {
      ...invoiceData,
      userId,
      invoiceNumber: `INV-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: invoiceData.status || 'draft'
    }
    
    const docRef = await addDoc(collection(db, 'invoices'), {
      ...invoice,
      createdAt: Timestamp.fromDate(invoice.createdAt),
      updatedAt: Timestamp.fromDate(invoice.updatedAt),
      issueDate: Timestamp.fromDate(invoice.issueDate),
      dueDate: invoice.dueDate ? Timestamp.fromDate(invoice.dueDate) : null,
    })
    
    return { id: docRef.id, ...invoice }
  },

  // Get user invoices
  async getUserInvoices(userId: string): Promise<Invoice[]> {
    const q = query(
      collection(db, 'invoices'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        issueDate: data.issueDate.toDate(),
        dueDate: data.dueDate ? data.dueDate.toDate() : undefined,
      } as Invoice
    })
  },

  // Get single invoice
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const docRef = doc(db, 'invoices', invoiceId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        issueDate: data.issueDate.toDate(),
        dueDate: data.dueDate ? data.dueDate.toDate() : undefined,
      } as Invoice
    }
    return null
  },

  // Update invoice
  async updateInvoice(invoiceId: string, updates: Partial<Omit<Invoice, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, 'invoices', invoiceId)
    const updateData: { [x: string]: FieldValue | Partial<unknown> | undefined } = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date())
    }
    
    if (updates.issueDate) {
      updateData.issueDate = Timestamp.fromDate(updates.issueDate)
    }
    if (updates.dueDate) {
      updateData.dueDate = Timestamp.fromDate(updates.dueDate)
    }
    
    await updateDoc(docRef, updateData)
  },

  // Delete invoice
  async deleteInvoice(invoiceId: string): Promise<void> {
    const docRef = doc(db, 'invoices', invoiceId)
    await deleteDoc(docRef)
  }
}
