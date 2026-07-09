import supabase from './db-client.js';
import { permissionFor, requireAuth } from './auth-utils.js';

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function firstWarehouseName() {
  const { data } = await supabase.from('warehouses').select('*').order('id', { ascending: true }).limit(1);
  return data?.[0]?.name || 'المستودع الرئيسي';
}

function generatedCode() {
  return `ITM-${Date.now()}`;
}

async function syncCurrentStock(item, previousName) {
  const quantity = numberValue(item.current_qty);
  const warehouse = await firstWarehouseName();
  const { data: stockRows, error } = await supabase.from('current_stock').select('*').order('id', { ascending: true });
  if (error) throw error;

  const existing = (stockRows || []).find((row) => String(row.item_name) === String(previousName || item.name));
  const stockPayload = {
    item_name: item.name,
    sku: '',
    barcode: '',
    warehouse,
    location: existing?.location || 'الموقع الرئيسي',
    batch_number: existing?.batch_number || '',
    serial_number: existing?.serial_number || '',
    expiry_date: existing?.expiry_date || '',
    qty_available: quantity,
    qty_reserved: numberValue(existing?.qty_reserved),
    qty_in_transit: numberValue(existing?.qty_in_transit),
    qty_damaged: numberValue(existing?.qty_damaged),
    last_movement_at: new Date().toISOString().slice(0, 10),
    status: quantity <= numberValue(item.min_qty) && numberValue(item.min_qty) > 0 ? 'warning' : 'active',
  };

  if (existing?.id) {
    const { error: updateError } = await supabase.from('current_stock').update(stockPayload).eq('id', existing.id).select().single();
    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await supabase.from('current_stock').insert(stockPayload).select().single();
  if (insertError) throw insertError;
}

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
      const { data, error } = await supabase.from('items').select('*').order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const body = req.body;
      const insertData = {
        code: body.code || generatedCode(),
        name: body.name,
        category: body.category || '',
        unit: body.unit || '',
        min_qty: numberValue(body.min_qty),
        max_qty: numberValue(body.max_qty),
        current_qty: numberValue(body.current_qty),
        tracking_method: body.tracking_method || 'none',
        status: body.status || 'active',
        notes: body.notes || '',
      };
      const { data, error } = await supabase.from('items').insert(insertData).select().single();
      if (error) throw error;
      await syncCurrentStock(data);
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...body } = req.body;
      const { data: beforeRows, error: beforeError } = await supabase.from('items').select('*').eq('id', id).limit(1);
      if (beforeError) throw beforeError;
      const previous = beforeRows?.[0];
      const updateData = {
        name: body.name,
        category: body.category || '',
        unit: body.unit || '',
        min_qty: numberValue(body.min_qty),
        max_qty: numberValue(body.max_qty),
        current_qty: numberValue(body.current_qty),
        tracking_method: body.tracking_method || 'none',
        status: body.status || 'active',
        notes: body.notes || '',
      };
      const { data, error } = await supabase.from('items').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      await syncCurrentStock(data, previous?.name);
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
