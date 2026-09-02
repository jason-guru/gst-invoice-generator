import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// Proxy for the Frankfurter FX API (FBIL / Financial Benchmarks India provider).
// Used to auto-fill an invoice's USD -> INR conversion rate from its date.
//
// GET /api/exchange-rate?date=YYYY-MM-DD  (date optional; omit for the latest)
//   -> { rate, date, requestedDate }
//
// Frankfurter automatically falls back to the most recent prior publication
// when the requested date has no rate (weekends, holidays, publishing lag), so
// the response `date` may be earlier than `requestedDate`. Dates with no rate
// at or before them (e.g. far-future dates) return 404 from the upstream.

const UPSTREAM = 'https://api.frankfurter.dev/v2/rate/USD/INR?providers=FBIL'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const date = request.nextUrl.searchParams.get('date') ?? undefined
    if (date && !DATE_RE.test(date)) {
      return NextResponse.json({ error: 'Invalid date; expected YYYY-MM-DD' }, { status: 400 })
    }

    const url = date ? `${UPSTREAM}&date=${date}` : UPSTREAM

    let upstream: Response
    try {
      upstream = await fetch(url, { headers: { accept: 'application/json' } })
    } catch (err) {
      console.error('Exchange-rate upstream fetch failed:', err)
      return NextResponse.json({ error: 'Could not reach the exchange-rate service' }, { status: 502 })
    }

    if (!upstream.ok) {
      const message =
        upstream.status === 404
          ? 'No exchange rate available for that date'
          : `Exchange-rate service returned ${upstream.status}`
      return NextResponse.json({ error: message }, { status: 502 })
    }

    const data = (await upstream.json()) as { rate?: unknown; date?: unknown }
    if (typeof data.rate !== 'number' || typeof data.date !== 'string') {
      return NextResponse.json({ error: 'Unexpected response from the exchange-rate service' }, { status: 502 })
    }

    return NextResponse.json({
      rate: data.rate,
      date: data.date,
      requestedDate: date ?? data.date,
    })
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
