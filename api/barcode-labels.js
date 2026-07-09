import supabase from './db-client.js';
import { permissionFor, requireAuth } from './auth-utils.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const authUser = await requireAuth(req, res, permissionFor(req.method, { GET: 'Items.View', POST: 'Items.Create', PUT: 'Items.Edit', DELETE: 'Items.Disable' }));
  if (!authUser) return;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('barcode_labels').select('*').order('id', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const { id, ...body } = req.body || {};
      const { data, error } = await supabase.from('barcode_labels').insert(body).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
