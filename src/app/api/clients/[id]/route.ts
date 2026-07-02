import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { clientAdminService } from '../../../../services/clientAdminService'

// Per-client operations. Ownership is enforced in clientAdminService against
// the userId taken from the NextAuth session — callers can never act on
// another user's client even by guessing its id.

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Whitelist updatable fields; ignore id/userId/createdAt if the client sends them.
    const updates: Record<string, unknown> = {}
    const allowed = ['name', 'email', 'address', 'country', 'currency']
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    const ok = await clientAdminService.updateClient(session.user.id, id, updates)
    if (!ok) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const ok = await clientAdminService.deleteClient(session.user.id, id)
    if (!ok) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
