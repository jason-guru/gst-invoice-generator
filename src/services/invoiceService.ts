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

export const invoiceService = {
  // Create invoice
  async createInvoice(userId: string, invoiceData: Omit<Invoice, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const invoice: Omit<Invoice, 'id'> = {
      ...invoiceData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    // Remove undefined values before saving to Firestore
    const cleanedInvoice = Object.fromEntries(
      Object.entries({
        ...invoice,
        createdAt: Timestamp.fromDate(invoice.createdAt),
        updatedAt: Timestamp.fromDate(invoice.updatedAt),
        invoiceDate: Timestamp.fromDate(invoice.invoiceDate),
      }).filter(([, value]) => value !== undefined)
    )
    
    const docRef = await addDoc(collection(db, 'invoices'), cleanedInvoice)
    
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
        invoiceDate: data.invoiceDate.toDate(),
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
        invoiceDate: data.invoiceDate.toDate(),
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
    
    if (updates.invoiceDate) {
      updateData.invoiceDate = Timestamp.fromDate(updates.invoiceDate)
    }
    
    // Remove undefined values before updating Firestore
    const cleanedUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined)
    )
    
    await updateDoc(docRef, cleanedUpdateData)
  },

  // Delete invoice
  async deleteInvoice(invoiceId: string): Promise<void> {
    const docRef = doc(db, 'invoices', invoiceId)
    await deleteDoc(docRef)
  }
}
