import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function getFirebaseAdminApp() {
  const existingApp = getApps().find((app) => app.name === '[DEFAULT]');
  if (existingApp) return existingApp;

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined
    })
  });
}

function authFailure(statusCode, message) {
  return {
    ok: false,
    response: {
      statusCode,
      body: JSON.stringify({ success: false, error: message })
    }
  };
}

export async function authorizeAdmin(event) {
  const allowedEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length === 0) {
    return authFailure(503, 'Admin access is not configured.');
  }

  const headers = event.headers || {};
  const authorization = Object.entries(headers)
    .find(([name]) => name.toLowerCase() === 'authorization')?.[1] || '';
  const bearerMatch = typeof authorization === 'string'
    ? authorization.match(/^Bearer\s+(\S+)\s*$/i)
    : null;
  if (!bearerMatch) {
    return authFailure(401, 'Not authorized.');
  }

  let decodedToken;
  try {
    decodedToken = await getAuth(getFirebaseAdminApp()).verifyIdToken(bearerMatch[1]);
  } catch {
    return authFailure(401, 'Not authorized.');
  }

  if (decodedToken.email_verified !== true || typeof decodedToken.email !== 'string') {
    return authFailure(403, 'Forbidden.');
  }

  if (!allowedEmails.includes(decodedToken.email.trim().toLowerCase())) {
    return authFailure(403, 'Forbidden.');
  }

  return { ok: true, email: decodedToken.email };
}
