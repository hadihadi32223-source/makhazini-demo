import supabase from './db-client.js';
import { permissionFor, requireAuth } from './auth-utils.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const authUser = await requireAuth(req, res, permissionFor(req.method, { GET: 'Warehouses.View', PUT: 'Warehouses.Create', POST: 'Warehouses.Create', DELETE: 'Warehouses.Create' }));
  if (!authUser) return;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('warehouses').select('*').order('id', { ascending: true }).limit(1);
      if (error) throw error;
      const warehouse = data?.[0] ? { ...data[0], status: 'active' } : null;
      return res.status(200).json(warehouse ? [warehouse] : []);
    }
    if (req.method === 'PUT') {
      const { id, name, manager } = req.body;
      const { data, error } = await supabase
        .from('warehouses')
        .update({ name, manager, status: 'active' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST' || req.method === 'DELETE') {
      return res.status(403).json({ error: 'لا يمكن إضافة أو تعطيل أو حذف المستودع الرئيسي.' });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
