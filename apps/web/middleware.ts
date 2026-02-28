import { NextRequest, NextResponse } from 'next/server'

export function middleware(_request: NextRequest) {
  const response = NextResponse.next()

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
