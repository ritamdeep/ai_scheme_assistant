import { NextRequest, NextResponse } from 'next/server';
import { SCHEMES_DATA } from '@/lib/schemes-data';
import { matchOccupationFuzzy } from '@/lib/rag';
import { unmatchedOccupationsStore } from '@/lib/unmatched-store';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const MAX_OCCUPATION_INPUT_LENGTH = 120;

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req.headers);
    const rateCheck = checkRateLimit(clientIp, 60, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const { occupationRaw } = await req.json();

    if (!occupationRaw || typeof occupationRaw !== 'string') {
      return NextResponse.json({ matches: {}, matchedSchemeIds: [] });
    }

    const trimmed = occupationRaw.trim();
    if (trimmed.length > MAX_OCCUPATION_INPUT_LENGTH) {
      return NextResponse.json(
        { error: `Occupation input exceeds ${MAX_OCCUPATION_INPUT_LENGTH} characters.` },
        { status: 400 }
      );
    }
    const matches: Record<string, { isMatch: boolean; score: number }> = {};
    const matchedSchemeIds: string[] = [];

    for (const scheme of SCHEMES_DATA) {
      const res = matchOccupationFuzzy(trimmed, scheme);
      if (res.isMatch) {
        matches[scheme.id] = res;
        matchedSchemeIds.push(scheme.id);
      }
    }

    // If no schemes matched, log to unmatched_occupations backlog
    if (matchedSchemeIds.length === 0) {
      const existing = unmatchedOccupationsStore.get(trimmed);
      if (existing) {
        existing.count += 1;
      } else {
        unmatchedOccupationsStore.set(trimmed, {
          count: 1,
          firstSeen: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      matches,
      matchedSchemeIds,
      totalMatches: matchedSchemeIds.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Fuzzy match error' }, { status: 500 });
  }
}
