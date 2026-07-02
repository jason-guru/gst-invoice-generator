'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { InvoicesProvider } from '../hooks/useInvoices'
import { ClientsProvider } from '../hooks/useClients'
import { SuppliersProvider } from '../hooks/useSuppliers'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    // Don't re-fetch the session (and cascade a full data reload) on every
    // window focus / page view. The session is refreshed only when explicitly
    // requested or when it actually expires.
    <SessionProvider refetchOnWindowFocus={false}>
      <InvoicesProvider>
        <ClientsProvider>
          <SuppliersProvider>{children}</SuppliersProvider>
        </ClientsProvider>
      </InvoicesProvider>
    </SessionProvider>
  )
}
