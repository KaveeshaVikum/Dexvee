// Step 1 of connecting AliExpress: visiting this URL in a browser sends you
// to AliExpress to log in and approve Dexvee's access. AliExpress then
// redirects back to aliexpress-callback.js with a one-time code.
//
// This only needs to be run once (or again if the refresh token ever dies).
// It's meant to be opened directly in a browser by you, the store admin —
// not called by the storefront itself.

export const handler = async (event) => {
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const siteUrl = process.env.URL || process.env.DEPLOY_URL; // Netlify sets these automatically

  if (!appKey) {
    return { statusCode: 500, body: 'ALIEXPRESS_APP_KEY is missing in Netlify Environment Variables.' };
  }
  if (!siteUrl) {
    return { statusCode: 500, body: 'Could not determine this site\'s URL to build the callback address.' };
  }

  const redirectUri = `${siteUrl}/.netlify/functions/aliexpress-callback`;

  const authorizeUrl = `https://api-sg.aliexpress.com/oauth/authorize?response_type=code&force_auth=true&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${appKey}`;

  return {
    statusCode: 302,
    headers: { Location: authorizeUrl }
  };
};