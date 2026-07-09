export type WmsRecord = Record<string, unknown> & { id: number | string };

const today = new Date().toISOString().slice(0, 10);
const inTenDays = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
const inFortyDays = new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10);

export const mockData = {
  categories: [
    { id: 1, name: 'مواد خام', status: 'active', notes: 'مواد تدخل في الإنتاج' },
    { id: 2, name: 'منتجات جاهزة', status: 'active', notes: 'جاهزة للصرف' },
    { id: 3, name: 'مواد تغليف', status: 'active', notes: 'كرتون، أكياس، ملصقات' },
    { id: 4, name: 'قطع غيار', status: 'active', notes: 'قطع صيانة وتشغيل' },
    { id: 5, name: 'مستهلكات', status: 'active', notes: 'مواد تشغيل يومية' },
  ],
  units: [
    { id: 1, name: 'قطعة', symbol: 'pcs', status: 'active' },
    { id: 2, name: 'كرتونة', symbol: 'ctn', status: 'active' },
    { id: 3, name: 'كيلو', symbol: 'kg', status: 'active' },
    { id: 4, name: 'لتر', symbol: 'L', status: 'active' },
    { id: 5, name: 'متر', symbol: 'm', status: 'active' },
  ],
  brands: [
    { id: 1, name: 'Generic', status: 'active', notes: 'علامة افتراضية' },
    { id: 2, name: 'SafePack', status: 'active', notes: 'مواد تغليف' },
    { id: 3, name: 'TechLine', status: 'active', notes: 'معدات وقطع' },
  ],
  manufacturers: [
    { id: 1, name: 'National Factory', country: 'Lebanon', status: 'active', notes: 'مصنّع محلي' },
    { id: 2, name: 'Global Supplies', country: 'Turkey', status: 'active', notes: 'توريد خارجي' },
  ],
  suppliers: [
    { id: 1, supplier_code: 'SUP-001', name: 'شركة الشرق للتوريد', companyName: 'Al Sharq', contact: 'حسن علي', phone: '01-000000', email: 'sup1@example.com', address: 'بيروت', status: 'active' },
    { id: 2, supplier_code: 'SUP-002', name: 'مؤسسة الأمان', companyName: 'Aman', contact: 'رامي ناصر', phone: '03-222222', email: 'sup2@example.com', address: 'صيدا', status: 'active' },
  ],
  recipients: [
    { id: 1, recipient_code: 'REC-001', name: 'فرع بيروت', type: 'فرع', contact: 'ليلى', phone: '70-111111', email: 'beirut@example.com', address: 'بيروت', status: 'active' },
    { id: 2, recipient_code: 'REC-002', name: 'قسم الصيانة', type: 'قسم داخلي', contact: 'مازن', phone: '71-222222', email: 'maint@example.com', address: 'المركز الرئيسي', status: 'active' },
    { id: 3, recipient_code: 'REC-003', name: 'مشروع الشمال', type: 'مشروع', contact: 'كريم', phone: '76-333333', email: 'north@example.com', address: 'طرابلس', status: 'active' },
  ],
  warehouses: [
    { id: 1, code: 'WH-001', name: 'المستودع الرئيسي', location: 'بيروت - المنطقة الصناعية', manager: 'أحمد المدير', phone: '01-123456', status: 'active' },
  ],
  locations: [
    { id: 1, warehouse: 'المستودع الرئيسي', zone: 'A', aisle: '01', rack: 'R01', level: 'L01', bin: 'B01', full_location_code: 'WH-001-A-01-R01-L01-B01', capacity: 500, status: 'active' },
    { id: 2, warehouse: 'المستودع الرئيسي', zone: 'A', aisle: '01', rack: 'R01', level: 'L02', bin: 'B04', full_location_code: 'WH-001-A-01-R01-L02-B04', capacity: 250, status: 'active' },
    { id: 3, warehouse: 'مستودع الفرع', zone: 'B', aisle: '02', rack: 'R03', level: 'L01', bin: 'B02', full_location_code: 'WH-002-B-02-R03-L01-B02', capacity: 350, status: 'active' },
  ],
  items: [
    { id: 1, code: 'ITM-001', sku: 'GLV-MED-L', barcode: '629100000001', qr_code: 'QR-ITM-001', name: 'قفازات طبية L', category: 'مستهلكات', unit: 'كرتونة', brand: 'Generic', manufacturer: 'National Factory', country: 'Lebanon', min_qty: 30, max_qty: 300, tracking_method: 'batch', current_qty: 24, status: 'active', expiry_date: inFortyDays, safety_stock: 20, lead_time_days: 7 },
    { id: 2, code: 'ITM-002', sku: 'BOX-30', barcode: '629100000002', qr_code: 'QR-ITM-002', name: 'كرتون تغليف 30 سم', category: 'مواد تغليف', unit: 'قطعة', brand: 'SafePack', manufacturer: 'Global Supplies', country: 'Turkey', min_qty: 100, max_qty: 1000, tracking_method: 'none', current_qty: 780, status: 'active', safety_stock: 100, lead_time_days: 10 },
    { id: 3, code: 'ITM-003', sku: 'SCN-USB', barcode: '629100000003', qr_code: 'QR-ITM-003', name: 'قارئ باركود USB', category: 'معدات', unit: 'قطعة', brand: 'TechLine', manufacturer: 'Global Supplies', country: 'China', min_qty: 5, max_qty: 40, tracking_method: 'serial', current_qty: 12, status: 'active', safety_stock: 2, lead_time_days: 14 },
    { id: 4, code: 'ITM-004', sku: 'SAN-5L', barcode: '629100000004', qr_code: 'QR-ITM-004', name: 'معقم 5 لتر', category: 'مستهلكات', unit: 'لتر', brand: 'Generic', manufacturer: 'National Factory', country: 'Lebanon', min_qty: 20, max_qty: 200, tracking_method: 'expiry', current_qty: 18, status: 'active', expiry_date: inTenDays, safety_stock: 15, lead_time_days: 5 },
  ],
  currentStock: [
    { id: 1, item_name: 'قفازات طبية L', sku: 'GLV-MED-L', barcode: '629100000001', warehouse: 'المستودع الرئيسي', location: 'WH-001-A-01-R01-L01-B01', batch_number: 'B-2026-07', serial_number: '', expiry_date: inFortyDays, qty_available: 24, qty_reserved: 4, qty_in_transit: 0, qty_damaged: 0, last_movement_at: today, status: 'warning' },
    { id: 2, item_name: 'كرتون تغليف 30 سم', sku: 'BOX-30', barcode: '629100000002', warehouse: 'المستودع الرئيسي', location: 'WH-001-A-01-R01-L02-B04', batch_number: '', serial_number: '', expiry_date: '', qty_available: 780, qty_reserved: 60, qty_in_transit: 100, qty_damaged: 5, last_movement_at: today, status: 'active' },
    { id: 3, item_name: 'قارئ باركود USB', sku: 'SCN-USB', barcode: '629100000003', warehouse: 'مستودع الفرع', location: 'WH-002-B-02-R03-L01-B02', batch_number: '', serial_number: 'SN-000349', expiry_date: '', qty_available: 1, qty_reserved: 0, qty_in_transit: 0, qty_damaged: 0, last_movement_at: today, status: 'active' },
    { id: 4, item_name: 'معقم 5 لتر', sku: 'SAN-5L', barcode: '629100000004', warehouse: 'المستودع الرئيسي', location: 'WH-001-A-01-R01-L01-B01', batch_number: 'SAN-0726', serial_number: '', expiry_date: inTenDays, qty_available: 18, qty_reserved: 0, qty_in_transit: 0, qty_damaged: 1, last_movement_at: today, status: 'danger' },
  ],
  stockMovements: [
    { id: 1, movement_no: 'MOV-000001', movement_date: today, item_name: 'قفازات طبية L', warehouse: 'المستودع الرئيسي', location: 'WH-001-A-01-R01-L01-B01', movement_type: 'وارد', qty_in: 50, qty_out: 0, balance_after: 50, reference_type: 'مستند وارد', reference_no: 'IN-2026-0001', batch_number: 'B-2026-07', serial_number: '', notes: 'إدخال كمية جديدة' },
    { id: 2, movement_no: 'MOV-000002', movement_date: today, item_name: 'قفازات طبية L', warehouse: 'المستودع الرئيسي', location: 'WH-001-A-01-R01-L01-B01', movement_type: 'صادر', qty_in: 0, qty_out: 26, balance_after: 24, reference_type: 'مستند صادر', reference_no: 'OUT-2026-0001', batch_number: 'B-2026-07', serial_number: '', notes: 'صرف للفرع' },
    { id: 3, movement_no: 'MOV-000003', movement_date: today, item_name: 'كرتون تغليف 30 سم', warehouse: 'المستودع الرئيسي', location: 'WH-001-A-01-R01-L02-B04', movement_type: 'تحويل صادر', qty_in: 0, qty_out: 100, balance_after: 780, reference_type: 'تحويل', reference_no: 'TR-2026-0001', batch_number: '', serial_number: '', notes: 'تحويل إلى الفرع' },
    { id: 4, movement_no: 'MOV-000004', movement_date: today, item_name: 'معقم 5 لتر', warehouse: 'المستودع الرئيسي', location: 'WH-001-A-01-R01-L01-B01', movement_type: 'تسوية جرد - نقص', qty_in: 0, qty_out: 2, balance_after: 18, reference_type: 'جرد', reference_no: 'CNT-2026-0001', batch_number: 'SAN-0726', serial_number: '', notes: 'فرق جرد' },
  ],
  incomingDocs: [
    { id: 1, doc_number: 'IN-2026-0001', doc_date: today, supplier: 'شركة الشرق للتوريد', party: 'شركة الشرق للتوريد', warehouse: 'المستودع الرئيسي', employee: 'أحمد المدير', status: 'approved', total_qty: 50, created_at: `${today}T08:30:00`, items: [{ item_name: 'قفازات طبية L', qty: 50, unit: 'كرتونة', batch_number: 'B-2026-07', serial_number: '', production_date: today, expiry_date: inFortyDays, location: 'WH-001-A-01-R01-L01-B01', notes: '' }] },
  ],
  outgoingDocs: [
    { id: 1, doc_number: 'OUT-2026-0001', doc_date: today, recipient: 'فرع بيروت', party: 'فرع بيروت', warehouse: 'المستودع الرئيسي', employee: 'أمين المستودع', status: 'approved', total_qty: 26, created_at: `${today}T09:15:00`, items: [{ item_name: 'قفازات طبية L', qty: 26, unit: 'كرتونة', batch_number: 'B-2026-07', serial_number: '', expiry_date: inFortyDays, location: 'WH-001-A-01-R01-L01-B01', notes: '' }] },
  ],
  transfers: [
    { id: 1, doc_number: 'TR-2026-0001', transfer_no: 'TR-2026-0001', doc_date: today, transfer_date: today, from_warehouse: 'المستودع الرئيسي', to_warehouse: 'مستودع الفرع', employee: 'أحمد المدير', status: 'approved', total_qty: 100, created_at: `${today}T10:00:00`, items: [{ item_name: 'كرتون تغليف 30 سم', qty: 100, unit: 'قطعة', from_location: 'WH-001-A-01-R01-L02-B04', to_location: 'WH-002-B-02-R03-L01-B02', batch_number: '', serial_number: '', expiry_date: '', notes: '' }] },
  ],
  inventoryCounts: [
    { id: 1, count_no: 'CNT-2026-0001', count_date: today, warehouse: 'المستودع الرئيسي', count_type: 'جرد جزئي', status: 'approved', employee: 'أمين المستودع', total_difference: -2, created_at: `${today}T11:00:00` },
  ],
  activityLog: [
    { id: 1, created_at: `${today}T08:30:00`, user_name: 'أحمد المدير', action: 'حفظ', entity: 'مستند وارد', entity_id: 'IN-2026-0001', details: 'حفظ مستند وارد وتوليد حركة مخزون' },
    { id: 2, created_at: `${today}T09:15:00`, user_name: 'أمين المستودع', action: 'حفظ', entity: 'مستند صادر', entity_id: 'OUT-2026-0001', details: 'حفظ مستند صادر بعد التحقق من الكمية' },
    { id: 3, created_at: `${today}T11:00:00`, user_name: 'مدير المستودع', action: 'حفظ', entity: 'الجرد', entity_id: 'CNT-2026-0001', details: 'حفظ فرق جرد مع حركة مخزون عكسية' },
  ],
  users: [
    { id: 1, full_name: 'مدير النظام', username: 'admin', role: 'مدير النظام', status: 'active', last_login_at: `${today}T07:50:00` },
    { id: 2, full_name: 'أحمد المدير', username: 'warehouse.manager', role: 'مدير المستودع', status: 'active', last_login_at: `${today}T08:00:00` },
    { id: 3, full_name: 'أمين المستودع', username: 'storekeeper', role: 'أمين المستودع', status: 'active', last_login_at: `${today}T09:00:00` },
  ],
  permissions: [
    { id: 1, module: 'الأصناف', permission: 'عرض', admin: true, manager: true, storekeeper: true, data_entry: true, readonly: true },
    { id: 2, module: 'الوارد', permission: 'إنشاء', admin: true, manager: true, storekeeper: true, data_entry: true, readonly: false },
    { id: 5, module: 'سجل النشاط', permission: 'عرض', admin: true, manager: true, storekeeper: false, data_entry: false, readonly: false },
  ],
  settings: [
    { id: 1, key: 'company_name', name: 'اسم الشركة', value: 'شركة تجريبية لإدارة المخزون', group: 'عام' },
    { id: 2, key: 'backup_path', name: 'مسار النسخ الاحتياطي', value: 'C:/powered by nexora/Backups', group: 'النسخ الاحتياطي' },
    { id: 3, key: 'near_expiry_days', name: 'تنبيه قرب الانتهاء بالأيام', value: '30', group: 'التنبيهات' },
    { id: 4, key: 'allow_negative_stock', name: 'السماح بكمية سالبة', value: 'false', group: 'قواعد المخزون' },
  ],
  backups: [
    { id: 1, backup_date: `${today}T12:00:00`, backup_path: 'C:/powered by nexora/Backups/wms-backup-20260707.db', created_by: 'مدير النظام', status: 'success', notes: 'نسخة يدوية' },
  ],
  barcodeLabels: [
    { id: 1, item_name: 'قفازات طبية L', sku: 'GLV-MED-L', barcode: '629100000001', qr_code: 'QR-ITM-001', labels_count: 20, label_size: '50x30mm', created_at: today },
    { id: 2, item_name: 'قارئ باركود USB', sku: 'SCN-USB', barcode: '629100000003', qr_code: 'QR-ITM-003', labels_count: 5, label_size: '60x40mm', created_at: today },
  ],
};

export type MockDataKey = keyof typeof mockData;

const MOCK_STORE_KEY = 'arabic_wms_mock_store_v2';

type MockStore = { [K in MockDataKey]: WmsRecord[] };

function cloneInitialStore(): MockStore {
  return JSON.parse(JSON.stringify(mockData)) as MockStore;
}

function getPrimaryWarehouseName(store: MockStore) {
  const [warehouse] = store.warehouses ?? [];
  const name = String(warehouse?.name ?? '').trim();
  return name || 'المستودع الرئيسي';
}

function applyPrimaryWarehouseName(row: WmsRecord, warehouseName: string): WmsRecord {
  const next = { ...row };
  if ('warehouse' in next) next.warehouse = warehouseName;
  if ('from_warehouse' in next) next.from_warehouse = warehouseName;
  if ('to_warehouse' in next) next.to_warehouse = warehouseName;
  return next;
}

function normalizeWarehouseReferences(store: MockStore): MockStore {
  const warehouseName = getPrimaryWarehouseName(store);
  const normalizeKey = (key: MockDataKey) => {
    store[key] = (store[key] ?? []).map((row) => applyPrimaryWarehouseName(row, warehouseName)) as MockStore[typeof key];
  };

  const primaryWarehouse = (store.warehouses ?? [])[0] ?? mockData.warehouses[0];
  store.warehouses = [{ ...primaryWarehouse, name: warehouseName, status: 'active' }];
  normalizeKey('locations');
  normalizeKey('currentStock');
  normalizeKey('stockMovements');
  normalizeKey('incomingDocs');
  normalizeKey('outgoingDocs');
  normalizeKey('transfers');
  normalizeKey('inventoryCounts');

  return store;
}

function readStore(): MockStore {
  if (typeof window === 'undefined' || !window.localStorage) return normalizeWarehouseReferences(cloneInitialStore());
  try {
    const raw = window.localStorage.getItem(MOCK_STORE_KEY);
    if (!raw) {
      const initial = normalizeWarehouseReferences(cloneInitialStore());
      window.localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<MockStore>;
    const store = normalizeWarehouseReferences({ ...cloneInitialStore(), ...parsed } as MockStore);
    window.localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(store));
    return store;
  } catch {
    return normalizeWarehouseReferences(cloneInitialStore());
  }
}

function writeStore(store: MockStore) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(normalizeWarehouseReferences(store)));
}

export function getMockData(key: MockDataKey): WmsRecord[] {
  return readStore()[key] ?? [];
}

export function createMockRecord(key: MockDataKey, body: Record<string, unknown>) {
  const store = readStore();
  const collection = [...(store[key] ?? [])];
  const maxId = collection.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
  const record = { id: maxId + 1, created_at: new Date().toISOString(), status: 'active', ...body } as WmsRecord;
  collection.unshift(record);
  store[key] = collection as MockStore[typeof key];
  writeStore(store);
  return record;
}

export function createMockRecords(key: MockDataKey, rows: Record<string, unknown>[]) {
  const store = readStore();
  const collection = [...(store[key] ?? [])];
  let maxId = collection.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
  const created = rows.map((body) => {
    maxId += 1;
    return { id: maxId, created_at: new Date().toISOString(), status: 'active', ...body } as WmsRecord;
  });
  store[key] = [...created, ...collection] as MockStore[typeof key];
  writeStore(store);
  return created;
}

export function updateMockRecord(key: MockDataKey, body: Record<string, unknown>) {
  const store = readStore();
  const collection = [...(store[key] ?? [])];
  const id = Number(body.id);
  const index = collection.findIndex((item) => Number(item.id) === id);
  if (index === -1) throw new Error('السجل غير موجود.');
  const updated = { ...collection[index], ...body, updated_at: new Date().toISOString() } as WmsRecord;
  collection[index] = updated;
  store[key] = collection as MockStore[typeof key];
  writeStore(store);
  return updated;
}

export function disableMockRecord(key: MockDataKey, id: number) {
  const store = readStore();
  const collection = [...(store[key] ?? [])];
  const index = collection.findIndex((item) => Number(item.id) === Number(id));
  if (index === -1) throw new Error('السجل غير موجود.');
  collection[index] = { ...collection[index], status: 'inactive', disabled_at: new Date().toISOString() } as WmsRecord;
  store[key] = collection as MockStore[typeof key];
  writeStore(store);
  return collection[index];
}

export function deleteMockRecord(key: MockDataKey, id: number) {
  const store = readStore();
  const collection = [...(store[key] ?? [])];
  const next = collection.filter((item) => Number(item.id) !== Number(id));
  if (next.length === collection.length) throw new Error('السجل غير موجود.');
  store[key] = next as MockStore[typeof key];
  writeStore(store);
  return { ok: true, action: 'deleted', id };
}

export function resetMockData() {
  const initial = cloneInitialStore();
  writeStore(initial);
  return initial;
}
