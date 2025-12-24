import { NextResponse } from 'next/server';

// Handle .well-known requests (e.g., Chrome DevTools probes)
// Return empty JSON to prevent 404 error page compilation
export async function GET() {
  return NextResponse.json({});
}
