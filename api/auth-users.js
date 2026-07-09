import {
  createPasswordHash,
  handleOptions,
  permissionFor,
  requireAuth,
  sanitizeUser,
  sendCors,
} from './auth-utils.js';
import { createUserRecord, deleteUserRecord, listUsers, updateUserRecord } from './auth-repository.js';

const roleNames = {
  admin: 'مدير النظام',
  manager: 'مدير المستودع',
  storekeeper: 'أمين المستودع',
  data_entry: 'موظف إدخال',
  readonly: 'قراءة فقط',
};

function normalizeRole(role) {
  if (!roleNames[role]) throw new Error('الدور غير صحيح');
  return role;
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  sendCors(req, res);

  const user = await requireAuth(req, res, permissionFor(req.method, {
    GET: 'Users.Manage',
    POST: 'Users.Manage',
    PUT: 'Users.Manage',
    DELETE: 'Users.Manage',
  }));
  if (!user) return;

  try {
    if (req.method === 'GET') {
      const users = await listUsers();
      return res.status(200).json((users || []).map(sanitizeUser));
    }

    if (req.method === 'POST') {
      const full_name = String(req.body?.full_name || '').trim();
      const username = String(req.body?.username || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      const role = normalizeRole(req.body?.role || 'storekeeper');
      if (!full_name) return res.status(400).json({ error: 'الاسم الكامل مطلوب' });
      if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
      const password_hash = createPasswordHash(password);
      const data = await createUserRecord({ full_name, username, password_hash, role, role_name: roleNames[role], status: 'active' });
      return res.status(201).json(sanitizeUser(data));
    }

    if (req.method === 'PUT') {
      const id = Number(req.body?.id);
      if (!id) return res.status(400).json({ error: 'معرّف المستخدم مطلوب' });
      if (id === user.id && req.body?.status && req.body.status !== 'active') {
        return res.status(400).json({ error: 'لا يمكن تعطيل المستخدم الحالي.' });
      }
      const patch = {};
      if (typeof req.body?.full_name === 'string') patch.full_name = req.body.full_name.trim();
      if (req.body?.role) {
        const role = normalizeRole(req.body.role);
        patch.role = role;
        patch.role_name = roleNames[role];
      }
      if (req.body?.status) {
        if (!['active', 'inactive', 'locked'].includes(req.body.status)) throw new Error('الحالة غير صحيحة');
        patch.status = req.body.status;
      }
      const data = await updateUserRecord(id, patch);
      return res.status(200).json(sanitizeUser(data));
    }

    if (req.method === 'DELETE') {
      const id = Number(req.body?.id);
      if (!id) return res.status(400).json({ error: 'معرّف المستخدم مطلوب' });
      if (id === user.id) return res.status(400).json({ error: 'لا يمكن حذف المستخدم الحالي.' });
      await deleteUserRecord(id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Auth users error:', err);
    return res.status(500).json({ error: err.message || 'تعذر تنفيذ العملية.' });
  }
}
