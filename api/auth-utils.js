import crypto from 'crypto';
import { findUserById } from './auth-repository.js';
import { createPasswordHash, verifyPassword } from './password-utils.js';
export { createPasswordHash, verifyPassword };

const ROLE_NAMES = {
  admin: 'مدير النظام',
  manager: 'مدير المستودع',
  storekeeper: 'أمين المستودع',
  data_entry: 'موظف إدخال',
  readonly: 'قراءة فقط',
};

const DEFAULT_ROLE_PERMISSIONS = {
  admin: ['*'],
  manager: [
    'Dashboard.View', 'Items.View', 'MasterData.View', 'Warehouses.View', 'Locations.View',
    'Stock.View', 'StockMovements.View', 'LowStock.View', 'Inbound.View', 'Outbound.View',
    'InventoryCount.View', 'Reports.View', 'AuditLog.View', 'Inbound.Create', 'Inbound.Cancel',
    'Outbound.Create', 'Outbound.Cancel', 'InventoryCount.Create', 'Backup.Manage',
  ],
  storekeeper: [
    'Dashboard.View', 'Items.View', 'MasterData.View', 'Warehouses.View', 'Locations.View',
    'Stock.View', 'StockMovements.View', 'LowStock.View', 'Inbound.View', 'Outbound.View',
    'InventoryCount.View', 'Reports.View', 'Inbound.Create', 'Outbound.Create', 'InventoryCount.Create',
  ],
  data_entry: [
    'Dashboard.View', 'Items.View', 'Items.Create', 'Items.Edit', 'MasterData.View', 'MasterData.Manage',
    'Warehouses.View', 'Locations.View', 'Stock.View', 'StockMovements.View', 'LowStock.View',
    'Inbound.View', 'Inbound.Create', 'Outbound.View', 'Outbound.Create', 'InventoryCount.View', 'Reports.View',
  ],
  readonly: [
    'Dashboard.View', 'Items.View', 'MasterData.View', 'Warehouses.View', 'Locations.View',
    'Stock.View', 'StockMovements.View', 'LowStock.View', 'Inbound.View', 'Outbound.View',
    'InventoryCount.View', 'Reports.View',
  ],
};

export function sendCors(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handleOptions(req, res) {
  sendCors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be configured with at least 32 characters.');
  }
  return secret;
}

export function signSession(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(user.id),
    username: user.username,
    role: user.role,
    iat: now,
    exp: now + 8 * 60 * 60,
  };
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', getAuthSecret()).update(data).digest('base64url');
  return { token: `${data}.${signature}`, expires_at: new Date(payload.exp * 1000).toISOString() };
}

export function verifySession(token) {
  if (!token) throw new Error('Missing session token');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid session token');
  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expected = crypto.createHmac('sha256', getAuthSecret()).update(data).digest('base64url');
  const sig = Buffer.from(signature);
  const exp = Buffer.from(expected);
  if (sig.length !== exp.length || !crypto.timingSafeEqual(sig, exp)) throw new Error('Invalid session token');
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Session expired');
  return payload;
}

export function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(header.split(';').map((item) => {
    const index = item.indexOf('=');
    if (index === -1) return ['', ''];
    return [decodeURIComponent(item.slice(0, index).trim()), decodeURIComponent(item.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

export function getRequestToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return parseCookies(req).wms_session;
}

export function sessionCookie(token, maxAgeSeconds = 8 * 60 * 60) {
  const secure = process.env.NODE_ENV === 'development' ? '' : '; Secure';
  return `wms_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === 'development' ? '' : '; Secure';
  return `wms_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

export function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    role: user.role,
    role_name: user.role_name || ROLE_NAMES[user.role] || user.role,
    status: user.status,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
  };
}

export function hasPermission(role, permission) {
  if (!permission) return true;
  if (role === 'admin') return true;
  const permissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

export async function requireAuth(req, res, permission) {
  try {
    const token = getRequestToken(req);
    const payload = verifySession(token);
    const user = await findUserById(Number(payload.sub));
    if (!user) { res.status(401).json({ error: 'انتهت الجلسة. الرجاء تسجيل الدخول من جديد.' }); return null; }
    if (user.status !== 'active') { res.status(403).json({ error: 'هذا الحساب غير فعال.' }); return null; }
    if (!hasPermission(user.role, permission)) { res.status(403).json({ error: 'ليست لديك صلاحية لتنفيذ هذه العملية.' }); return null; }
    return sanitizeUser(user);
  } catch (error) {
    res.status(401).json({ error: 'انتهت الجلسة. الرجاء تسجيل الدخول من جديد.' });
    return null;
  }
}

export function permissionFor(method, map) {
  return map[method] || map.DEFAULT;
}
