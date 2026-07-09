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

  const authUser = await requireAuth(req, res, permissionFor(req.method, { GET: 'InventoryCount.View', POST: 'InventoryCount.Create', PUT: 'InventoryCount.Create', DELETE: 'InventoryCount.Create' }));
  if (!authUser) return;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('inventory_counts').select('*').order('id', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { items, ...header } = req.body;
      const { data: doc, error: docError } = await supabase.from('inventory_counts').insert(header).select().single();
      if (docError) throw docError;

      if (items && items.length > 0) {
        const detailRows = items.map((it) => ({ ...it, inventory_count_id: doc.id }));
        const { error: itemsError } = await supabase.from('inventory_count_items').insert(detailRows);
        if (itemsError) throw itemsError;
      }
      return res.status(201).json({ ...doc, items: items || [] });
    }
    if (req.method === 'PUT') {
      const { id, ...rest } = req.body;
      const { data, error } = await supabase.from('inventory_counts').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await supabase.from('inventory_count_items').delete().eq('inventory_count_id', id);
      const { error } = await supabase.from('inventory_counts').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
