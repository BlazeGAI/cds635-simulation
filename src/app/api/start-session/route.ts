import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { createSessionCookie, sessionCookieOptions, SESSION_COOKIE_NAME } from '@/src/lib/session';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    let body: unknown;

    try {
      body = await req.json();
    } catch (error) {
      console.error('Failed to parse start-session request JSON', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const studentDisplayName =
      body && typeof body === 'object' && typeof (body as Record<string, unknown>).studentDisplayName === 'string'
        ? (body as Record<string, string>).studentDisplayName.trim()
        : '';
    const scenarioId =
      body && typeof body === 'object' && typeof (body as Record<string, unknown>).scenarioId === 'string'
        ? (body as Record<string, string>).scenarioId
        : '';

    if (!studentDisplayName || !scenarioId) {
      return NextResponse.json({ error: 'studentDisplayName and scenarioId are required' }, { status: 400 });
    }

    if (!process.env.SESSION_SECRET) {
      console.error('SESSION_SECRET not set for POST /api/start-session');
      return NextResponse.json({ error: 'SESSION_SECRET not set' }, { status: 500 });
    }

    const sessionId = randomUUID();
    const startedAt = new Date().toISOString();
    const cookieValue = createSessionCookie({ sessionId, scenarioId, startedAt, studentDisplayName });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, cookieValue, sessionCookieOptions);

    return NextResponse.json({ sessionId, startedAt });
  } catch (error) {
    console.error('Unhandled POST /api/start-session error', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ error: 'Unable to start session' }, { status: 500 });
  }
}
