import {
  handleOptions,
  sanitizeUser,
  sendCors,
  sessionCookie,
  signSession,
  verifyPassword,
} from './auth-utils.js';
import { findUserByUsername, updateLastLogin } from './auth-repository.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  sendCors(req, res);

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const username = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!username || !password) return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان.' });

    const user = await findUserByUsername(username);

    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'هذا الحساب غير فعال.' });
    }

    const now = new Date().toISOString();
    const updatedUser = await updateLastLogin(user.id, now);
    const safeUser = sanitizeUser(updatedUser || { ...user, last_login_at: now });
    const { token, expires_at } = signSession(safeUser);
    res.setHeader('Set-Cookie', sessionCookie(token));
    return res.status(200).json({ user: safeUser, expires_at });
  } catch (err) {
    console.error('Auth login error:', err);
    return res.status(500).json({ error: 'تعذر تسجيل الدخول. تحقق من إعدادات الخادم.' });
  }
}
