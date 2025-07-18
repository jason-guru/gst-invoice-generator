import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { invoiceService } from '../../../services/invoiceService'

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoices = await invoiceService.getUserInvoices(session.user.id)
    return NextResponse.json(invoices)
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

    const invoiceData = {
      invoiceNumber,
      invoiceDate: new Date(invoiceDate),
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

    const invoice = await invoiceService.createInvoice(session.user.id, invoiceData)
    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
