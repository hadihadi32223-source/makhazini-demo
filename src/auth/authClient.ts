import { roleName, type AuthUser, type RoleKey } from './authData';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const CURRENT_USER_KEY = 'arabic_wms_current_user';
const DEMO_USERS_KEY = 'arabic_wms_demo_users';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_USE_BACKEND_API === 'false';

export type CreateUserInput = {
  full_name: string;
  username: string;
  password: string;
  role: RoleKey;
};

export type UpdateUserInput = Partial<Pick<AuthUser, 'full_name' | 'role' | 'status'>>;


type DemoUserRecord = AuthUser & { password: string };

const demoUserSeed: DemoUserRecord[] = [
  { id: 1, full_name: 'مدير النظام', username: 'admin', password: 'admin123', role: 'admin', role_name: 'مدير النظام', status: 'active', last_login_at: null, created_at: '2026-07-09T00:00:00.000Z' },
  { id: 2, full_name: 'مدير المستودع', username: 'warehouse.manager', password: 'manager123', role: 'manager', role_name: 'مدير المستودع', status: 'active', last_login_at: null, created_at: '2026-07-09T00:00:00.000Z' },
  { id: 3, full_name: 'أمين المستودع', username: 'storekeeper', password: 'store123', role: 'storekeeper', role_name: 'أمين المستودع', status: 'active', last_login_at: null, created_at: '2026-07-09T00:00:00.000Z' },
  { id: 4, full_name: 'موظف إدخال البيانات', username: 'data.entry', password: 'data123', role: 'data_entry', role_name: 'موظف إدخال', status: 'active', last_login_at: null, created_at: '2026-07-09T00:00:00.000Z' },
  { id: 5, full_name: 'مستخدم قراءة فقط', username: 'readonly', password: 'read123', role: 'readonly', role_name: 'قراءة فقط', status: 'active', last_login_at: null, created_at: '2026-07-09T00:00:00.000Z' },
];

function sanitizeDemoUser(user: DemoUserRecord): AuthUser {
  return {
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    role: user.role,
    role_name: user.role_name,
    status: user.status,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
  };
}

function readDemoUsers(): DemoUserRecord[] {
  try {
    const raw = localStorage.getItem(DEMO_USERS_KEY);
    const parsed = raw ? JSON.parse(raw) as DemoUserRecord[] : null;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // Fall back to the clean demo seed when localStorage is unavailable or invalid.
  }
  const seededUsers = demoUserSeed.map((user) => ({ ...user }));
  writeDemoUsers(seededUsers);
  return seededUsers;
}

function writeDemoUsers(users: DemoUserRecord[]) {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

function nextDemoUserId(users: DemoUserRecord[]) {
  return users.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) as AuthUser : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user: AuthUser | null) {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
    return;
  }
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

async function readJson(res: Response) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
}

async function authRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return readJson(res);
}

export function getStoredAuthUser() {
  return readStoredUser();
}

export function setStoredAuthUser(user: AuthUser | null) {
  writeStoredUser(user);
}

export async function loginWithBackend(username: string, password: string) {
  if (DEMO_MODE) {
    const normalizedUsername = username.trim().toLowerCase();
    const users = readDemoUsers();
    const index = users.findIndex((user) => user.username === normalizedUsername);
    const user = users[index];

    if (!user || user.password !== password) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }

    if (user.status !== 'active') {
      throw new Error('هذا الحساب غير فعال.');
    }

    const updatedUser = { ...user, last_login_at: new Date().toISOString() };
    users[index] = updatedUser;
    writeDemoUsers(users);

    const safeUser = sanitizeDemoUser(updatedUser);
    writeStoredUser(safeUser);
    return safeUser;
  }

  const data = await authRequest('/auth-login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  writeStoredUser(data.user);
  return data.user as AuthUser;
}

export async function getCurrentUserFromBackend() {
  if (DEMO_MODE) return readStoredUser();

  const data = await authRequest('/auth-me');
  const user = data.user ? data.user as AuthUser : null;
  writeStoredUser(user);
  return user;
}

export async function logoutFromBackend() {
  try {
    if (!DEMO_MODE) await authRequest('/auth-logout', { method: 'POST' });
  } finally {
    writeStoredUser(null);
  }
}

export async function listBackendUsers() {
  if (DEMO_MODE) return readDemoUsers().map(sanitizeDemoUser);

  const data = await authRequest('/auth-users');
  return data as AuthUser[];
}

export async function createBackendUser(input: CreateUserInput) {
  if (DEMO_MODE) {
    const users = readDemoUsers();
    const normalizedUsername = input.username.trim().toLowerCase();
    if (users.some((user) => user.username === normalizedUsername)) throw new Error('اسم المستخدم مستخدم سابقاً');

    const record: DemoUserRecord = {
      id: nextDemoUserId(users),
      full_name: input.full_name.trim(),
      username: normalizedUsername,
      password: input.password,
      role: input.role,
      role_name: roleName(input.role),
      status: 'active',
      last_login_at: null,
      created_at: new Date().toISOString(),
    };
    writeDemoUsers([...users, record]);
    return sanitizeDemoUser(record);
  }

  return authRequest('/auth-users', {
    method: 'POST',
    body: JSON.stringify(input),
  }) as Promise<AuthUser>;
}

export async function updateBackendUser(id: number, patch: UpdateUserInput) {
  if (DEMO_MODE) {
    const users = readDemoUsers();
    const index = users.findIndex((user) => Number(user.id) === Number(id));
    if (index === -1) throw new Error('المستخدم غير موجود');

    const nextUser: DemoUserRecord = {
      ...users[index],
      ...patch,
      role_name: patch.role ? roleName(patch.role) : users[index].role_name,
    };
    users[index] = nextUser;
    writeDemoUsers(users);
    return sanitizeDemoUser(nextUser);
  }

  return authRequest('/auth-users', {
    method: 'PUT',
    body: JSON.stringify({ id, ...patch }),
  }) as Promise<AuthUser>;
}

export async function disableBackendUser(id: number) {
  return updateBackendUser(id, { status: 'inactive' });
}

export async function deleteBackendUser(id: number) {
  if (DEMO_MODE) {
    const users = readDemoUsers();
    const nextUsers = users.filter((user) => Number(user.id) !== Number(id));
    if (nextUsers.length === users.length) throw new Error('المستخدم غير موجود');
    writeDemoUsers(nextUsers);
    return { ok: true };
  }

  return authRequest('/auth-users', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  }) as Promise<{ ok: boolean }>;
}
