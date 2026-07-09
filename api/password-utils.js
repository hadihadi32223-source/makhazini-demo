import crypto from 'crypto';

export function createPasswordHash(password) {
  if (!password || password.length < 6) throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  const salt = crypto.randomBytes(16).toString('base64url');
  const iterations = 310000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64url');
  return `pbkdf2_sha256$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('pbkdf2_sha256$')) return false;
  const [, iterationText, salt, hash] = stored.split('$');
  const iterations = Number(iterationText);
  if (!iterations || !salt || !hash) return false;
  const calculated = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64url');
  const a = Buffer.from(calculated);
  const b = Buffer.from(hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
