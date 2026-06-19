import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '../../libs/firebaseAdmin'
import { Invoice } from '../types/invoice'

// Server-only invoice data access via the Firebase Admin SDK. Every read/write
// is scoped to the authenticated `userId`, which the API layer takes from the
// NextAuth session (never from client-supplied input). The Admin SDK bypasses
// Firestore rules, so the database itself can deny all direct client access.

const COLLECTION = 'invoices'

type FirestoreInvoiceData = Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceDate'> & {
  createdAt: Timestamp
  updatedAt: Timestamp
  invoiceDate: Timestamp
}

function toInvoice(id: string, data: FirebaseFirestore.DocumentData): Invoice {
  return {
    id,
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    invoiceDate: data.invoiceDate.toDate(),
  } as Invoice
}

export const invoiceAdminService = {
  // Create an invoice owned by `userId`.
  async createInvoice(
    userId: string,
    invoiceData: Omit<Invoice, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<Invoice> {
    const now = new Date()
    const invoice: Omit<Invoice, 'id'> = {
      ...invoiceData,
      userId,
      createdAt: now,
      updatedAt: now,
    }

    const docData: Partial<FirestoreInvoiceData> = Object.fromEntries(
      Object.entries({
        ...invoice,
        createdAt: Timestamp.fromDate(invoice.createdAt),
        updatedAt: Timestamp.fromDate(invoice.updatedAt),
        invoiceDate: Timestamp.fromDate(invoice.invoiceDate),
      }).filter(([, value]) => value !== undefined)
    )

    const docRef = await adminDb.collection(COLLECTION).add(docData)
    return { id: docRef.id, ...invoice }
  },

  // List all invoices owned by `userId`, newest first.
  async getUserInvoices(userId: string): Promise<Invoice[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map((doc) => toInvoice(doc.id, doc.data()))
  },

  // Fetch a single invoice, but only if it belongs to `userId`.
  async getInvoice(userId: string, invoiceId: string): Promise<Invoice | null> {
    const docSnap = await adminDb.collection(COLLECTION).doc(invoiceId).get()
    if (!docSnap.exists) return null

    const data = docSnap.data()!
    if (data.userId !== userId) return null

    return toInvoice(docSnap.id, data)
  },

  // Update an invoice, only if it belongs to `userId`. Returns false if the
  // invoice does not exist or is owned by someone else.
  async updateInvoice(
    userId: string,
    invoiceId: string,
    updates: Partial<Omit<Invoice, 'id' | 'userId' | 'createdAt'>>
  ): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(invoiceId)
    const docSnap = await docRef.get()
    if (!docSnap.exists || docSnap.data()!.userId !== userId) return false

    // Never allow the owner or audit fields to be reassigned via updates.
    const safeUpdates: Partial<Invoice> = { ...updates }
    delete safeUpdates.userId
    delete safeUpdates.id
    delete safeUpdates.createdAt

    const updateData: Record<string, unknown> = {
      ...safeUpdates,
      updatedAt: Timestamp.fromDate(new Date()),
    }
    if (safeUpdates.invoiceDate) {
      updateData.invoiceDate = Timestamp.fromDate(safeUpdates.invoiceDate as Date)
    }

    const cleaned = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined)
    )

    await docRef.update(cleaned)
    return true
  },

  // Delete an invoice, only if it belongs to `userId`. Returns false if missing
  // or not owned by the caller.
  async deleteInvoice(userId: string, invoiceId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(invoiceId)
    const docSnap = await docRef.get()
    if (!docSnap.exists || docSnap.data()!.userId !== userId) return false

    await docRef.delete()
    return true
  },
}
