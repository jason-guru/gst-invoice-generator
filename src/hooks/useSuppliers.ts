import { createContext, createElement, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { Supplier } from '../types/supplier'

// Saved suppliers are accessed exclusively through authenticated API routes,
// same as invoices — the browser never talks to Firestore directly.

// Dates arrive from the API as ISO strings; revive them into Date objects.
function reviveSupplier(raw: Record<string, unknown>): Supplier {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt as string),
    updatedAt: new Date(raw.updatedAt as string),
  } as Supplier
}

function useSuppliersState() {
  const { data: session } = useSession()
  // Key effects off the stable user id, not the session.user object (see
  // useInvoices for the rationale).
  const userId = (session?.user as { id?: string })?.id
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSuppliers = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/suppliers')
      if (!res.ok) throw new Error(`Failed to load suppliers (${res.status})`)
      const data = (await res.json()) as { suppliers: Record<string, unknown>[] }
      setSuppliers(data.suppliers.map(reviveSupplier))
    } catch (error) {
      console.error('Error loading suppliers:', error)
      setError('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadSuppliers()
    } else {
      setLoading(false)
    }
  }, [userId, loadSuppliers])

  const createSupplier = async (supplierData: {
    name: string
    address: string
    gstin: string
  }): Promise<Supplier> => {
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplierData),
    })
    if (!res.ok) {
      const message = await res.json().catch(() => ({}))
      console.error('Error creating supplier:', message)
      throw new Error(message.error || 'Failed to create supplier')
    }
    const newSupplier = reviveSupplier(await res.json())
    await loadSuppliers()
    return newSupplier
  }

  const updateSupplier = async (supplierId: string, updates: Partial<Supplier>): Promise<void> => {
    const res = await fetch(`/api/suppliers/${supplierId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      const message = await res.json().catch(() => ({}))
      console.error('Error updating supplier:', message)
      throw new Error(message.error || 'Failed to update supplier')
    }
    setSuppliers((prev) =>
      prev.map((supplier) =>
        supplier.id === supplierId
          ? { ...supplier, ...updates, updatedAt: new Date() }
          : supplier
      )
    )
  }

  const deleteSupplier = async (supplierId: string): Promise<void> => {
    const res = await fetch(`/api/suppliers/${supplierId}`, { method: 'DELETE' })
    if (!res.ok) {
      const message = await res.json().catch(() => ({}))
      console.error('Error deleting supplier:', message)
      throw new Error(message.error || 'Failed to delete supplier')
    }
    setSuppliers((prev) => prev.filter((supplier) => supplier.id !== supplierId))
  }

  return {
    suppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    refreshSuppliers: loadSuppliers,
  }
}

type SuppliersContextValue = ReturnType<typeof useSuppliersState>

const SuppliersContext = createContext<SuppliersContextValue | null>(null)

// Single shared instance so the list is fetched once and reused everywhere.
export function SuppliersProvider({ children }: { children: ReactNode }) {
  const value = useSuppliersState()
  return createElement(SuppliersContext.Provider, { value }, children)
}

export function useSuppliers() {
  const context = useContext(SuppliersContext)
  if (!context) {
    throw new Error('useSuppliers must be used within a SuppliersProvider')
  }
  return context
}
