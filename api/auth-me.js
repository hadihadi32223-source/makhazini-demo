import { clearSessionCookie, getRequestToken, handleOptions, requireAuth, sendCors } from './auth-utils.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  sendCors(req, res);

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = getRequestToken(req);
  if (!token) return res.status(200).json({ user: null });

  const user = await requireAuth(req, res);
  if (!user) {
    res.setHeader('Set-Cookie', clearSessionCookie());
    return;
  }
  return res.status(200).json({ user });
}
