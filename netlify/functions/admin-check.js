import { authorizeAdmin } from './utils/admin-auth.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const authorization = await authorizeAdmin(event);
  if (!authorization.ok) return authorization.response;

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, email: authorization.email })
  };
};
