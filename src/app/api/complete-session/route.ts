import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, verifySessionCookie } from '@/src/lib/session';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const sessionSchema = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'SESSION_SCHEMA.json'), 'utf8'));
const validateSession = ajv.compile(sessionSchema);

export async function POST(req: Request) {
  const cookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return NextResponse.json({ error: 'Session cookie missing' }, { status: 401 });

  const session = verifySessionCookie(cookie);
  if (!session) return NextResponse.json({ error: 'Invalid session cookie' }, { status: 401 });

  const body = await req.json();
  const primaryHypothesis = typeof body.primaryHypothesis === 'string' ? body.primaryHypothesis.trim() : '';
  const riskLevel = body.riskLevel;
  const confidenceLevel = body.confidenceLevel;
  const inputBranchDecisions = Array.isArray(body.branchDecisions) ? body.branchDecisions : [];

  const completedAt = new Date().toISOString();
  const durationMinutes = Math.max(1, Math.floor((new Date(completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000));

  const branchDecisions = inputBranchDecisions.map((d: any) => ({
    branchId: String(d.branchId ?? ''),
    prompt: String(d.prompt ?? ''),
    selectedOption: String(d.selectedOption ?? ''),
    timestamp: completedAt,
  }));

  const finalRecord = {
    sessionId: session.sessionId,
    studentDisplayName: session.studentDisplayName,
    scenarioId: session.scenarioId,
    startedAt: session.startedAt,
    completedAt,
    durationMinutes,
    primaryHypothesis,
    riskLevel,
    confidenceLevel,
    branchDecisions,
    status: 'COMPLETED',
  };

  const ok = validateSession(finalRecord);
  if (!ok) {
    return NextResponse.json({ error: 'Session validation failed', details: validateSession.errors }, { status: 500 });
  }

  return NextResponse.json(finalRecord);
}
