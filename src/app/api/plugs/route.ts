import { NextResponse } from 'next/server'

// Mock database
let plugs = [
  { id: '1', name: "Suleiman Yusuf", trade: "Electrician", rating: 4.8, status: "Verified", badge: "Verified", location: "Yaba" },
  { id: '2', name: "John Okoro", trade: "Plumber", rating: 4.9, status: "Available", badge: "Pro", location: "Sabo" },
  { id: '3', name: "Tunde Williams", trade: "Electrician", rating: 4.7, status: "Busy", badge: "Verified", location: "Alagomeji" },
]

export async function GET() {
  return NextResponse.json(plugs)
}

export async function POST(request: Request) {
  const body = await request.json()
  const newPlug = {
    id: String(plugs.length + 1),
    ...body,
    rating: 0,
    status: 'Pending',
    badge: 'Basic'
  }
  plugs.push(newPlug)
  return NextResponse.json(newPlug, { status: 201 })
}
