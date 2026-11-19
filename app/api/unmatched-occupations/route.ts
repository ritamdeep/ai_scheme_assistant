import { NextRequest, NextResponse } from 'next/server';
import { unmatchedOccupationsStore } from '@/lib/unmatched-store';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req.headers);
  const rateCheck = checkRateLimit(clientIp, 60, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  const backlog: Array<{ occupation_raw: string; count: number; first_seen: string }> = [];
  unmatchedOccupationsStore.forEach((value, key) => {
    backlog.push({
      occupation_raw: key,
      count: value.count,
      first_seen: value.firstSeen,
    });
  });

  return NextResponse.json({
    totalUnmatched: backlog.length,
    backlog,
  });
}
