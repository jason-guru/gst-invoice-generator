import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '../../libs/firebaseAdmin'
import { Supplier } from '../types/supplier'

// Server-only supplier data access via the Firebase Admin SDK. Every read/write
// is scoped to the authenticated `userId`, which the API layer takes from the
// NextAuth session (never from client-supplied input). The Admin SDK bypasses
// Firestore rules, so the database itself can deny all direct client access.

const COLLECTION = 'suppliers'

function toSupplier(id: string, data: FirebaseFirestore.DocumentData): Supplier {
  return {
    id,
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as Supplier
}

export const supplierAdminService = {
  // Create a supplier owned by `userId`.
  async createSupplier(
    userId: string,
    supplierData: Omit<Supplier, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<Supplier> {
    const now = new Date()
    const supplier: Omit<Supplier, 'id'> = {
      ...supplierData,
      userId,
      createdAt: now,
      updatedAt: now,
    }

    const docData = Object.fromEntries(
      Object.entries({
        ...supplier,
        createdAt: Timestamp.fromDate(supplier.createdAt),
        updatedAt: Timestamp.fromDate(supplier.updatedAt),
      }).filter(([, value]) => value !== undefined)
    )

    const docRef = await adminDb.collection(COLLECTION).add(docData)
    return { id: docRef.id, ...supplier }
  },

  // List all suppliers owned by `userId`, sorted by name. The list is small, so
  // sorting happens in memory — filtering by userId alone needs no composite
  // Firestore index, whereas an orderBy would.
  async getUserSuppliers(userId: string): Promise<Supplier[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where('userId', '==', userId)
      .get()

    return snapshot.docs
      .map((doc) => toSupplier(doc.id, doc.data()))
      .sort((a, b) => a.name.localeCompare(b.name))
  },

  // Find a supplier by name (case-insensitive, trimmed). Used to dedupe
  // auto-saved suppliers when invoices are created.
  async findByName(userId: string, name: string): Promise<Supplier | null> {
    const needle = name.trim().toLowerCase()
    const suppliers = await this.getUserSuppliers(userId)
    return suppliers.find((s) => s.name.trim().toLowerCase() === needle) ?? null
  },

  // Update a supplier, only if it belongs to `userId`. Returns false if the
  // supplier does not exist or is owned by someone else.
  async updateSupplier(
    userId: string,
    supplierId: string,
    updates: Partial<Omit<Supplier, 'id' | 'userId' | 'createdAt'>>
  ): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(supplierId)
    const docSnap = await docRef.get()
    if (!docSnap.exists || docSnap.data()!.userId !== userId) return false

    // Never allow the owner or audit fields to be reassigned via updates.
    const safeUpdates: Partial<Supplier> = { ...updates }
    delete safeUpdates.userId
    delete safeUpdates.id
    delete safeUpdates.createdAt

    const cleaned = Object.fromEntries(
      Object.entries({
        ...safeUpdates,
        updatedAt: Timestamp.fromDate(new Date()),
      }).filter(([, value]) => value !== undefined)
    )

    await docRef.update(cleaned)
    return true
  },

  // Delete a supplier, only if it belongs to `userId`. Returns false if missing
  // or not owned by the caller.
  async deleteSupplier(userId: string, supplierId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(supplierId)
    const docSnap = await docRef.get()
    if (!docSnap.exists || docSnap.data()!.userId !== userId) return false

    await docRef.delete()
    return true
  },
}
