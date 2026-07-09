import type { SpreadsheetRow } from './spreadsheetImport';

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[\s_\-/\\().:]+/g, '');
}

function getValue(row: SpreadsheetRow, aliases: string[]) {
  const normalized = new Map(Object.entries(row).map(([key, value]) => [normalize(key), value]));
  for (const alias of aliases) {
    const value = normalized.get(normalize(alias));
    if (value !== undefined && value !== '') return value;
  }
  return '';
}

function normalizeStatus(value: string, fallback = 'active') {
  const status = normalize(value);
  if (!status) return fallback;
  if (['inactive', 'disabled', 'معطل', 'غيرمفعل', 'غيرفعال'].includes(status)) return 'inactive';
  if (['warning', 'تحتالحد', 'منخفض'].includes(status)) return 'warning';
  if (['danger', 'خطر'].includes(status)) return 'danger';
  return 'active';
}

function toNumber(value: string) {
  const parsed = Number(String(value || '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapCustomerImportRow(row: SpreadsheetRow) {
  return {
    name: getValue(row, ['name', 'customer', 'customer name', 'client', 'client name', 'اسم العميل', 'العميل', 'الاسم']),
    type: getValue(row, ['type', 'customer type', 'نوع العميل', 'نوع العميل/الجهة', 'نوع الجهة', 'النوع']) || 'عميل',
    phone: getValue(row, ['phone', 'mobile', 'telephone', 'الهاتف', 'الجوال', 'رقم الهاتف']),
    email: getValue(row, ['email', 'e-mail', 'mail', 'البريد الإلكتروني', 'البريد الالكتروني', 'الايميل']),
    address: getValue(row, ['address', 'العنوان', 'location', 'الموقع']),
    status: normalizeStatus(getValue(row, ['status', 'الحالة']), 'active'),
  };
}


export function mapItemImportRow(row: SpreadsheetRow) {
  const tracking = normalize(getValue(row, ['tracking_method', 'tracking', 'طريقة التتبع', 'التتبع']));
  let trackingMethod = 'none';
  if (['batch', 'batchnumber', 'باتش', 'تشغيله', 'رقمالتشغيله'].includes(tracking)) trackingMethod = 'batch';
  if (['serial', 'serialnumber', 'سيريال', 'رقمتسلسلي'].includes(tracking)) trackingMethod = 'serial';
  if (['expiry', 'expiration', 'expire', 'تاريخانتهاء', 'انتهاء', 'صلاحيه'].includes(tracking)) trackingMethod = 'expiry';

  return {
    name: getValue(row, ['name', 'item_name', 'item name', 'item', 'product', 'product name', 'اسم الصنف', 'الصنف', 'البضاعة', 'المادة', 'الاسم']),
    category: getValue(row, ['category', 'item category', 'التصنيف', 'الفئة']),
    unit: getValue(row, ['unit', 'uom', 'الوحدة', 'وحدة']),
    current_qty: toNumber(getValue(row, ['current_qty', 'quantity', 'qty', 'stock', 'الكمية', 'الكمية الحالية', 'المخزون'])),
    min_qty: toNumber(getValue(row, ['min_qty', 'minimum', 'minimum qty', 'min', 'الحد الأدنى', 'حد أدنى'])),
    max_qty: toNumber(getValue(row, ['max_qty', 'maximum', 'maximum qty', 'max', 'الحد الأعلى', 'حد أعلى'])),
    tracking_method: trackingMethod,
    status: normalizeStatus(getValue(row, ['status', 'الحالة']), 'active'),
    notes: getValue(row, ['notes', 'note', 'ملاحظات', 'ملاحظة']),
  };
}

export function mapCurrentStockImportRow(row: SpreadsheetRow) {
  return {
    item_name: getValue(row, ['item_name', 'item name', 'item', 'product', 'product name', 'اسم الصنف', 'الصنف', 'البضاعة', 'المادة']),
    sku: getValue(row, ['sku', 'SKU', 'كود الصنف', 'رمز الصنف']),
    barcode: getValue(row, ['barcode', 'bar code', 'باركود', 'الباركود']),
    warehouse: getValue(row, ['warehouse', 'المستودع', 'اسم المستودع']),
    location: getValue(row, ['location', 'bin', 'موقع التخزين', 'الموقع', 'مكان التخزين']),
    batch_number: getValue(row, ['batch_number', 'batch', 'batch number', 'رقم التشغيلة', 'باتش']),
    serial_number: getValue(row, ['serial_number', 'serial', 'serial number', 'رقم تسلسلي', 'سيريال']),
    expiry_date: getValue(row, ['expiry_date', 'expiry', 'expiration date', 'تاريخ الانتهاء', 'انتهاء']),
    qty_available: toNumber(getValue(row, ['qty_available', 'available qty', 'quantity', 'qty', 'المتاح', 'الكمية المتاحة', 'الكمية'])),
    qty_reserved: toNumber(getValue(row, ['qty_reserved', 'reserved qty', 'reserved', 'المحجوز'])),
    qty_in_transit: toNumber(getValue(row, ['qty_in_transit', 'in transit', 'قيد النقل'])),
    qty_damaged: toNumber(getValue(row, ['qty_damaged', 'damaged', 'التالف'])),
    last_movement_at: getValue(row, ['last_movement_at', 'last movement', 'آخر حركة', 'اخر حركة']) || new Date().toISOString().slice(0, 10),
    status: normalizeStatus(getValue(row, ['status', 'الحالة']), 'active'),
  };
}
