import { clearSessionCookie, handleOptions, sendCors } from './auth-utils.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  sendCors(req, res);

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Set-Cookie', clearSessionCookie());
  return res.status(200).json({ ok: true });
}
