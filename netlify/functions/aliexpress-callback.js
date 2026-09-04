import { AESystemClient } from 'ae_sdk';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
    })
  });
}

const db = getFirestore();

function htmlPage(title, message, ok) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: `
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 60px 20px; background: ${ok ? '#f0fdf4' : '#fef2f2'};">
          <h2 style="color: ${ok ? '#15803d' : '#b91c1c'};">${title}</h2>
          <p style="color: #444;">${message}</p>
        </body>
      </html>
    `
  };
}

export const handler = async (event) => {
  const code = event.queryStringParameters?.code;

  if (!code) {
    return htmlPage('Authorization failed', 'AliExpress did not send back an authorization code. Try the authorize link again.', false);
  }

  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;

  if (!appKey || !appSecret) {
    return htmlPage('Setup incomplete', 'ALIEXPRESS_APP_KEY or ALIEXPRESS_APP_SECRET is missing in Netlify Environment Variables.', false);
  }

  try {
    const systemClient = new AESystemClient({ app_key: appKey, app_secret: appSecret, session: '' });
    const tokenResponse = await systemClient.generateToken({ code });

    console.log('AliExpress generateToken response:', JSON.stringify(tokenResponse));

    if (!tokenResponse.ok) {
      return htmlPage('AliExpress rejected the request', tokenResponse.message || 'Unknown error — check the function logs for the full response.', false);
    }

    const { access_token, refresh_token, expires_in, user_nick, account } = tokenResponse.data;

    // Stored once, reused by every future AliExpress API call — this is the
    // one thing that makes the whole integration work without re-authorizing
    // by hand every time.
    await db.collection('settings').doc('aliexpress').set({
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      obtainedAt: FieldValue.serverTimestamp(),
      accountNick: user_nick || null,
      account: account || null
    });

    return htmlPage(
      'AliExpress connected!',
      `Authorized as ${user_nick || account || 'your AliExpress account'}. You can close this tab and go back to Dexvee.`,
      true
    );
  } catch (error) {
    console.error('AliExpress callback error:', error);
    return htmlPage('Something went wrong', error.message, false);
  }
};