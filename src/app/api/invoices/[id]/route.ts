import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { invoiceAdminService } from '../../../../services/invoiceAdminService'

// Per-invoice operations. Ownership is enforced in invoiceAdminService against
// the userId taken from the NextAuth session — clients can never act on another
// user's invoice even by guessing its id.

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const invoice = await invoiceAdminService.getInvoice(session.user.id, id)
    if (!invoice) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const allowed = [
      'invoiceNumber',
      'invoiceDate',
      'supplierName',
      'supplierAddress',
      'supplierGSTIN',
      'recipientName',
      'recipientEmail',
      'recipientAddress',
      'recipientCountry',
      'recipientCurrency',
      'fxRate',
      'lutId',
      'notes',
      'items',
    ]
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key]
    }
    if (updates.invoiceDate) updates.invoiceDate = new Date(updates.invoiceDate as string)
    if (updates.fxRate !== undefined) updates.fxRate = Number(updates.fxRate) || 0

    const ok = await invoiceAdminService.updateInvoice(session.user.id, id, updates)
    if (!ok) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating invoice:', error)
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
    const ok = await invoiceAdminService.deleteInvoice(session.user.id, id)
    if (!ok) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
