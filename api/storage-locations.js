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

  const authUser = await requireAuth(req, res, permissionFor(req.method, { GET: 'Locations.View', POST: 'Locations.Create', PUT: 'Locations.Create', DELETE: 'Locations.Create' }));
  if (!authUser) return;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('storage_locations').select('*').order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { warehouse, zone, aisle, rack, level, bin, capacity, status } = req.body;
      const { data, error } = await supabase.from('storage_locations').insert({ warehouse, zone, aisle, rack, level, bin, capacity, status }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...rest } = req.body;
      const { data, error } = await supabase.from('storage_locations').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      const { error } = await supabase.from('storage_locations').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
