import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '../../libs/firebaseAdmin'
import { Client } from '../types/client'

// Server-only client data access via the Firebase Admin SDK. Every read/write
// is scoped to the authenticated `userId`, which the API layer takes from the
// NextAuth session (never from client-supplied input). The Admin SDK bypasses
// Firestore rules, so the database itself can deny all direct client access.

const COLLECTION = 'clients'

function toClient(id: string, data: FirebaseFirestore.DocumentData): Client {
  return {
    id,
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as Client
}

export const clientAdminService = {
  // Create a client owned by `userId`.
  async createClient(
    userId: string,
    clientData: Omit<Client, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<Client> {
    const now = new Date()
    const client: Omit<Client, 'id'> = {
      ...clientData,
      userId,
      createdAt: now,
      updatedAt: now,
    }

    const docData = Object.fromEntries(
      Object.entries({
        ...client,
        createdAt: Timestamp.fromDate(client.createdAt),
        updatedAt: Timestamp.fromDate(client.updatedAt),
      }).filter(([, value]) => value !== undefined)
    )

    const docRef = await adminDb.collection(COLLECTION).add(docData)
    return { id: docRef.id, ...client }
  },

  // List all clients owned by `userId`, sorted by name. The list is small, so
  // sorting happens in memory — filtering by userId alone needs no composite
  // Firestore index, whereas an orderBy would.
  async getUserClients(userId: string): Promise<Client[]> {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where('userId', '==', userId)
      .get()

    return snapshot.docs
      .map((doc) => toClient(doc.id, doc.data()))
      .sort((a, b) => a.name.localeCompare(b.name))
  },

  // Find a client by name (case-insensitive, trimmed). Used to dedupe
  // auto-saved clients when invoices are created.
  async findByName(userId: string, name: string): Promise<Client | null> {
    const needle = name.trim().toLowerCase()
    const clients = await this.getUserClients(userId)
    return clients.find((c) => c.name.trim().toLowerCase() === needle) ?? null
  },

  // Update a client, only if it belongs to `userId`. Returns false if the
  // client does not exist or is owned by someone else.
  async updateClient(
    userId: string,
    clientId: string,
    updates: Partial<Omit<Client, 'id' | 'userId' | 'createdAt'>>
  ): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(clientId)
    const docSnap = await docRef.get()
    if (!docSnap.exists || docSnap.data()!.userId !== userId) return false

    // Never allow the owner or audit fields to be reassigned via updates.
    const safeUpdates: Partial<Client> = { ...updates }
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

  // Delete a client, only if it belongs to `userId`. Returns false if missing
  // or not owned by the caller.
  async deleteClient(userId: string, clientId: string): Promise<boolean> {
    const docRef = adminDb.collection(COLLECTION).doc(clientId)
    const docSnap = await docRef.get()
    if (!docSnap.exists || docSnap.data()!.userId !== userId) return false

    await docRef.delete()
    return true
  },
}
