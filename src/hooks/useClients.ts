import { createContext, createElement, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { Client } from '../types/client'

// Saved clients are accessed exclusively through authenticated API routes,
// same as invoices — the browser never talks to Firestore directly.

// Dates arrive from the API as ISO strings; revive them into Date objects.
function reviveClient(raw: Record<string, unknown>): Client {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt as string),
    updatedAt: new Date(raw.updatedAt as string),
  } as Client
}

function useClientsState() {
  const { data: session } = useSession()
  // Key effects off the stable user id, not the session.user object (see
  // useInvoices for the rationale).
  const userId = (session?.user as { id?: string })?.id
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadClients = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/clients')
      if (!res.ok) throw new Error(`Failed to load clients (${res.status})`)
      const data = (await res.json()) as { clients: Record<string, unknown>[] }
      setClients(data.clients.map(reviveClient))
    } catch (error) {
      console.error('Error loading clients:', error)
      setError('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadClients()
    } else {
      setLoading(false)
    }
  }, [userId, loadClients])

  const createClient = async (clientData: {
    name: string
    email?: string
    address: string
    country: string
    currency: string
  }): Promise<Client> => {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData),
    })
    if (!res.ok) {
      const message = await res.json().catch(() => ({}))
      console.error('Error creating client:', message)
      throw new Error(message.error || 'Failed to create client')
    }
    const newClient = reviveClient(await res.json())
    await loadClients()
    return newClient
  }

  const updateClient = async (clientId: string, updates: Partial<Client>): Promise<void> => {
    const res = await fetch(`/api/clients/${clientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      const message = await res.json().catch(() => ({}))
      console.error('Error updating client:', message)
      throw new Error(message.error || 'Failed to update client')
    }
    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? { ...client, ...updates, updatedAt: new Date() }
          : client
      )
    )
  }

  const deleteClient = async (clientId: string): Promise<void> => {
    const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' })
    if (!res.ok) {
      const message = await res.json().catch(() => ({}))
      console.error('Error deleting client:', message)
      throw new Error(message.error || 'Failed to delete client')
    }
    setClients((prev) => prev.filter((client) => client.id !== clientId))
  }

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    refreshClients: loadClients,
  }
}

type ClientsContextValue = ReturnType<typeof useClientsState>

const ClientsContext = createContext<ClientsContextValue | null>(null)

// Single shared instance so the list is fetched once and reused everywhere.
export function ClientsProvider({ children }: { children: ReactNode }) {
  const value = useClientsState()
  return createElement(ClientsContext.Provider, { value }, children)
}

export function useClients() {
  const context = useContext(ClientsContext)
  if (!context) {
    throw new Error('useClients must be used within a ClientsProvider')
  }
  return context
}
