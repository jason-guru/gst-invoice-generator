import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { invoiceAdminService } from '../../../services/invoiceAdminService'
import { clientAdminService } from '../../../services/clientAdminService'
import { supplierAdminService } from '../../../services/supplierAdminService'

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 100

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE)
    )

    const { invoices, total } = await invoiceAdminService.getUserInvoices(
      session.user.id,
      { page, pageSize }
    )
    return NextResponse.json({ invoices, total, page, pageSize })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      invoiceNumber,
      invoiceDate,
      supplierName,
      supplierAddress,
      supplierGSTIN,
      recipientName,
      recipientEmail,
      recipientAddress,
      recipientCountry,
      recipientCurrency,
      fxRate,
      lutId,
      notes, 
      items 
    } = body

    // Validate required fields
    if (!invoiceNumber || !supplierName || !recipientName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields: invoiceNumber, supplierName, recipientName, and items are required' 
      }, { status: 400 })
    }

    // Auto-save new suppliers/clients to the user's saved lists so they can be
    // picked from a dropdown on future invoices. Matched by name (create-only:
    // one-off edits to the denormalized fields never overwrite a saved entry).
    // A failed auto-save must never fail invoice creation.
    let supplierId: string | undefined = body.supplierId || undefined
    if (!supplierId && typeof supplierName === 'string' && supplierName.trim()) {
      try {
        const existing = await supplierAdminService.findByName(session.user.id, supplierName)
        supplierId = existing
          ? existing.id
          : (
              await supplierAdminService.createSupplier(session.user.id, {
                name: supplierName.trim(),
                address: supplierAddress ?? '',
                gstin: supplierGSTIN ?? '',
              })
            ).id
      } catch (error) {
        console.error('Error auto-saving supplier:', error)
      }
    }

    let clientId: string | undefined = body.clientId || undefined
    if (!clientId && typeof recipientName === 'string' && recipientName.trim()) {
      try {
        const existing = await clientAdminService.findByName(session.user.id, recipientName)
        clientId = existing
          ? existing.id
          : (
              await clientAdminService.createClient(session.user.id, {
                name: recipientName.trim(),
                email: recipientEmail || undefined,
                address: recipientAddress ?? '',
                country: recipientCountry ?? '',
                currency: recipientCurrency ?? '',
              })
            ).id
      } catch (error) {
        console.error('Error auto-saving client:', error)
      }
    }

    const invoiceData = {
      invoiceNumber,
      invoiceDate: new Date(invoiceDate),
      supplierId,
      clientId,
      supplierName,
      supplierAddress,
      supplierGSTIN,
      recipientName,
      recipientEmail,
      recipientAddress,
      recipientCountry,
      recipientCurrency,
      fxRate: Number(fxRate) || 0,
      lutId,
      notes,
      items: items.map((item: { description: string; hsn: string; quantity: number; rate: number; amount: number }) => ({
        description: item.description,
        hsn: item.hsn,
        quantity: Number(item.quantity) || 1,
        rate: Number(item.rate) || 0,
        amount: Number(item.amount) || 0
      }))
    }

    const invoice = await invoiceAdminService.createInvoice(session.user.id, invoiceData)
    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
