import { createMockRecord, createMockRecords, deleteMockRecord, disableMockRecord, getMockData, updateMockRecord, type MockDataKey } from './mockData';

const API_BASE = '/api';

// Important:
// This project is currently a front-end WMS demo. When it runs inside XAMPP/Apache
// or Vite without a real backend, requests like /api/suppliers can return the
// JavaScript source file api/suppliers.js instead of JSON. That caused this error:
// Unexpected token 'i', "import sup"... is not valid JSON.
//
// For safety, the app uses local mock data by default. Enable the real backend only
// by adding VITE_USE_BACKEND_API=true to a .env file when an actual API runtime exists.
const USE_BACKEND_API = import.meta.env.VITE_USE_BACKEND_API !== 'false';

const endpointMap: Record<string, MockDataKey> = {
  '/categories': 'categories',
  '/units': 'units',
  '/brands': 'brands',
  '/manufacturers': 'manufacturers',
  '/suppliers': 'suppliers',
  '/recipients': 'recipients',
  '/warehouses': 'warehouses',
  '/storage-locations': 'locations',
  '/items': 'items',
  '/current-stock': 'currentStock',
  '/stock-movements': 'stockMovements',
  '/incoming-docs': 'incomingDocs',
  '/outgoing-docs': 'outgoingDocs',
  '/transfers': 'transfers',
  '/inventory-counts': 'inventoryCounts',
  '/activity-log': 'activityLog',
  '/users': 'users',
  '/permissions': 'permissions',
  '/settings': 'settings',
  '/backups': 'backups',
  '/barcode-labels': 'barcodeLabels',
};

function parseRequestBody(options?: RequestInit) {
  if (!options?.body) return {};
  if (typeof options.body !== 'string') return {};

  try {
    return JSON.parse(options.body);
  } catch {
    return {};
  }
}

function fallbackResponse(path: string, options?: RequestInit) {
  const key = endpointMap[path];
  if (!key) return [];

  if (path === '/warehouses') {
    if (options?.method === 'POST') throw new Error('لا يمكن إضافة مستودع جديد. النظام يعتمد مستودعًا واحدًا فقط.');
    if (options?.method === 'DELETE') throw new Error('لا يمكن تعطيل أو حذف المستودع الرئيسي.');
    if (options?.method === 'PUT') {
      const body = parseRequestBody(options) as { id?: number; name?: unknown; manager?: unknown };
      return updateMockRecord(key, { id: body.id, name: body.name, manager: body.manager, status: 'active' });
    }
  }

  if (options?.method === 'POST') {
    const body = parseRequestBody(options) as { rows?: Record<string, unknown>[] };
    if (Array.isArray(body.rows)) return createMockRecords(key, body.rows);
    return createMockRecord(key, body);
  }

  if (options?.method === 'PUT') {
    return updateMockRecord(key, parseRequestBody(options));
  }

  if (options?.method === 'DELETE') {
    const body = parseRequestBody(options) as { id?: number; forceDelete?: boolean };
    if (!body.id) return { ok: false, message: 'Missing id' };
    return body.forceDelete ? deleteMockRecord(key, Number(body.id)) : disableMockRecord(key, Number(body.id));
  }

  if (path === '/warehouses') {
    const [warehouse] = getMockData(key);
    return warehouse ? [{ ...warehouse, status: 'active' }] : [];
  }

  return getMockData(key);
}

async function parseJsonResponse(res: Response, path: string) {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  if (!contentType.includes('application/json')) {
    throw new Error(
      `Expected JSON from ${path}, but received ${contentType || 'unknown content type'}. ` +
      `First characters: ${text.slice(0, 40)}`
    );
  }

  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON from ${path}: ${(error as Error).message}`);
  }
}

async function request(path: string, options?: RequestInit) {
  if (!USE_BACKEND_API) {
    return fallbackResponse(path, options);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });

  return parseJsonResponse(res, path);
}

const create = (path: string, body: unknown) => request(path, { method: 'POST', body: JSON.stringify(body) });
const update = (path: string, body: unknown) => request(path, { method: 'PUT', body: JSON.stringify(body) });
const disable = (path: string, id: number) => request(path, { method: 'DELETE', body: JSON.stringify({ id }) });
const hardDelete = (path: string, id: number) => request(path, { method: 'DELETE', body: JSON.stringify({ id, forceDelete: true }) });

export const api = {
  categories: () => request('/categories'),
  units: () => request('/units'),
  brands: () => request('/brands'),
  manufacturers: () => request('/manufacturers'),
  suppliers: () => request('/suppliers'),
  recipients: () => request('/recipients'),
  warehouses: () => request('/warehouses'),
  locations: () => request('/storage-locations'),
  items: () => request('/items'),
  currentStock: () => request('/current-stock'),
  stockMovements: () => request('/stock-movements'),
  incomingDocs: () => request('/incoming-docs'),
  outgoingDocs: () => request('/outgoing-docs'),
  transfers: () => request('/transfers'),
  inventoryCounts: () => request('/inventory-counts'),
  activityLog: () => request('/activity-log'),
  users: () => request('/users'),
  permissions: () => request('/permissions'),
  settings: () => request('/settings'),
  backups: () => request('/backups'),
  barcodeLabels: () => request('/barcode-labels'),

  createCategory: (body: unknown) => create('/categories', body),
  updateCategory: (body: unknown) => update('/categories', body),
  deleteCategory: (id: number) => disable('/categories', id),
  hardDeleteCategory: (id: number) => hardDelete('/categories', id),

  createUnit: (body: unknown) => create('/units', body),
  updateUnit: (body: unknown) => update('/units', body),
  deleteUnit: (id: number) => disable('/units', id),
  hardDeleteUnit: (id: number) => hardDelete('/units', id),

  createBrand: (body: unknown) => create('/brands', body),
  updateBrand: (body: unknown) => update('/brands', body),
  deleteBrand: (id: number) => disable('/brands', id),
  hardDeleteBrand: (id: number) => hardDelete('/brands', id),

  createManufacturer: (body: unknown) => create('/manufacturers', body),
  updateManufacturer: (body: unknown) => update('/manufacturers', body),
  deleteManufacturer: (id: number) => disable('/manufacturers', id),
  hardDeleteManufacturer: (id: number) => hardDelete('/manufacturers', id),

  createSupplier: (body: unknown) => create('/suppliers', body),
  updateSupplier: (body: unknown) => update('/suppliers', body),
  deleteSupplier: (id: number) => disable('/suppliers', id),
  hardDeleteSupplier: (id: number) => hardDelete('/suppliers', id),

  createRecipient: (body: unknown) => create('/recipients', body),
  updateRecipient: (body: unknown) => update('/recipients', body),
  deleteRecipient: (id: number) => disable('/recipients', id),
  hardDeleteRecipient: (id: number) => hardDelete('/recipients', id),

  createItem: (body: unknown) => create('/items', body),
  updateItem: (body: unknown) => update('/items', body),
  deleteItem: (id: number) => disable('/items', id),
  hardDeleteItem: (id: number) => hardDelete('/items', id),

  createWarehouse: (body: unknown) => create('/warehouses', body),
  updateWarehouse: (body: unknown) => update('/warehouses', body),
  deleteWarehouse: (id: number) => disable('/warehouses', id),
  hardDeleteWarehouse: (id: number) => hardDelete('/warehouses', id),
  importCurrentStockRows: (rows: Record<string, unknown>[]) => request('/current-stock', { method: 'POST', body: JSON.stringify({ rows }) }),

  createLocation: (body: unknown) => create('/storage-locations', body),
  updateLocation: (body: unknown) => update('/storage-locations', body),
  deleteLocation: (id: number) => disable('/storage-locations', id),
  hardDeleteLocation: (id: number) => hardDelete('/storage-locations', id),

  createIncomingDoc: (body: unknown) => create('/incoming-docs', body),
  createOutgoingDoc: (body: unknown) => create('/outgoing-docs', body),
  createTransfer: (body: unknown) => create('/transfers', body),
  createInventoryCount: (body: unknown) => create('/inventory-counts', body),
  createBackup: (body: unknown) => create('/backups', body),
  createBarcodeLabel: (body: unknown) => create('/barcode-labels', body),
};
