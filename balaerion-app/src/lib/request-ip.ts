import type { NextRequest } from 'next/server';

/**
 * Extracts client IP transiently in RAM for daily-rotating HMAC rate limiting (V10).
 * Never log, store, or echo the returned string.
 */
export function extractTransientClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return '127.0.0.1';
}
