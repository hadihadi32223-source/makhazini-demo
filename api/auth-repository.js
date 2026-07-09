import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from './db-client.js';
import { createPasswordHash } from './password-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '.data');
const USERS_FILE = path.join(DATA_DIR, 'auth-users.json');

const roleNames = {
  admin: 'مدير النظام',
  manager: 'مدير المستودع',
  storekeeper: 'أمين المستودع',
  data_entry: 'موظف إدخال',
  readonly: 'قراءة فقط',
};

function useSupabase() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function ensureLocalUsers() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(USERS_FILE)) return;

  const now = new Date().toISOString();
  const seed = [
    { id: 1, full_name: 'مدير النظام', username: 'admin', password: 'admin123', role: 'admin' },
    { id: 2, full_name: 'مدير المستودع', username: 'warehouse.manager', password: 'manager123', role: 'manager' },
    { id: 3, full_name: 'أمين المستودع', username: 'storekeeper', password: 'store123', role: 'storekeeper' },
    { id: 4, full_name: 'موظف إدخال البيانات', username: 'data.entry', password: 'data123', role: 'data_entry' },
    { id: 5, full_name: 'مستخدم قراءة فقط', username: 'readonly', password: 'read123', role: 'readonly' },
  ];

  const users = seed.map(({ password, role, ...user }) => ({
    ...user,
    role,
    role_name: roleNames[role],
    password_hash: createPasswordHash(password),
    status: 'active',
    last_login_at: null,
    created_at: now,
  }));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readLocalUsers() {
  ensureLocalUsers();
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function writeLocalUsers(users) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function authBackendName() {
  return useSupabase() ? 'supabase' : 'local-json';
}

export async function findUserByUsername(username) {
  if (useSupabase()) {
    const { data, error } = await supabase.from('auth_users').select('*').eq('username', username).single();
    if (error) return null;
    return data;
  }
  return readLocalUsers().find((user) => user.username === username) || null;
}

export async function findUserById(id) {
  if (useSupabase()) {
    const { data, error } = await supabase
      .from('auth_users')
      .select('id, full_name, username, role, role_name, status, last_login_at, created_at')
      .eq('id', Number(id))
      .single();
    if (error) return null;
    return data;
  }
  return readLocalUsers().find((user) => Number(user.id) === Number(id)) || null;
}

export async function listUsers() {
  if (useSupabase()) {
    const { data, error } = await supabase
      .from('auth_users')
      .select('id, full_name, username, role, role_name, status, last_login_at, created_at')
      .order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  }
  return readLocalUsers().sort((a, b) => a.id - b.id);
}

export async function updateLastLogin(id, last_login_at) {
  if (useSupabase()) {
    const { data, error } = await supabase
      .from('auth_users')
      .update({ last_login_at })
      .eq('id', Number(id))
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }
  const users = readLocalUsers();
  const index = users.findIndex((user) => Number(user.id) === Number(id));
  if (index === -1) return null;
  users[index] = { ...users[index], last_login_at };
  writeLocalUsers(users);
  return users[index];
}

export async function createUserRecord(input) {
  if (useSupabase()) {
    const { data, error } = await supabase
      .from('auth_users')
      .insert(input)
      .select('id, full_name, username, role, role_name, status, last_login_at, created_at')
      .single();
    if (error) throw error;
    return data;
  }
  const users = readLocalUsers();
  if (users.some((user) => user.username === input.username)) throw new Error('اسم المستخدم مستخدم سابقاً');
  const id = users.reduce((max, user) => Math.max(max, Number(user.id) || 0), 0) + 1;
  const record = { id, ...input, created_at: new Date().toISOString(), last_login_at: null };
  users.push(record);
  writeLocalUsers(users);
  return record;
}

export async function updateUserRecord(id, patch) {
  if (useSupabase()) {
    const { data, error } = await supabase
      .from('auth_users')
      .update(patch)
      .eq('id', Number(id))
      .select('id, full_name, username, role, role_name, status, last_login_at, created_at')
      .single();
    if (error) throw error;
    return data;
  }
  const users = readLocalUsers();
  const index = users.findIndex((user) => Number(user.id) === Number(id));
  if (index === -1) throw new Error('المستخدم غير موجود');
  users[index] = { ...users[index], ...patch };
  writeLocalUsers(users);
  return users[index];
}

export async function deleteUserRecord(id) {
  if (useSupabase()) {
    const { error } = await supabase.from('auth_users').delete().eq('id', Number(id));
    if (error) throw error;
    return true;
  }
  const users = readLocalUsers();
  const next = users.filter((user) => Number(user.id) !== Number(id));
  if (next.length === users.length) throw new Error('المستخدم غير موجود');
  writeLocalUsers(next);
  return true;
}
