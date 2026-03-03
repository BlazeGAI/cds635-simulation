import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { createSessionCookie, sessionCookieOptions, SESSION_COOKIE_NAME } from '@/src/lib/session';

export async function POST(req: Request) {
  const body = await req.json();
  const studentDisplayName = typeof body.studentDisplayName === 'string' ? body.studentDisplayName.trim() : '';
  const scenarioId = typeof body.scenarioId === 'string' ? body.scenarioId : '';

  if (!studentDisplayName || !scenarioId) {
    return NextResponse.json({ error: 'studentDisplayName and scenarioId are required' }, { status: 400 });
  }

  const sessionId = randomUUID();
  const startedAt = new Date().toISOString();
  const cookieValue = createSessionCookie({ sessionId, scenarioId, startedAt, studentDisplayName });

  cookies().set(SESSION_COOKIE_NAME, cookieValue, sessionCookieOptions);

  return NextResponse.json({ sessionId, startedAt });
}
