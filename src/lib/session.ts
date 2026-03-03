import crypto from 'node:crypto';

export const SESSION_COOKIE_NAME = 'cds635_session';

export type SessionCookiePayload = {
  sessionId: string;
  scenarioId: string;
  startedAt: string;
  studentDisplayName: string;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is required');
  return secret;
}

function sign(value: string): string {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

export function createSessionCookie(payload: SessionCookiePayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionCookie(cookieValue: string): SessionCookiePayload | null {
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expected = sign(encodedPayload);

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (
      !payload ||
      typeof payload.sessionId !== 'string' ||
      typeof payload.scenarioId !== 'string' ||
      typeof payload.startedAt !== 'string' ||
      typeof payload.studentDisplayName !== 'string'
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};
