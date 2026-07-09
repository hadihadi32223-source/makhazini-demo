export type RoleKey = 'admin' | 'manager' | 'storekeeper' | 'data_entry' | 'readonly';

export type AuthUser = {
  id: number;
  full_name: string;
  username: string;
  role: RoleKey;
  role_name: string;
  status: 'active' | 'inactive' | 'locked';
  last_login_at?: string | null;
  created_at?: string | null;
};

export type RoleDefinition = {
  key: RoleKey;
  name: string;
  description: string;
};

export type PermissionDefinition = {
  code: string;
  nameAr: string;
  module: string;
  description: string;
};

const ROLE_PERMISSIONS_KEY = 'arabic_wms_role_permissions';

export const roleDefinitions: RoleDefinition[] = [
  { key: 'admin', name: 'مدير النظام', description: 'صلاحيات كاملة على النظام' },
  { key: 'manager', name: 'مدير المستودع', description: 'إدارة العمليات المخزنية ومراقبة التقارير' },
  { key: 'storekeeper', name: 'أمين المستودع', description: 'إنشاء مستندات الوارد والصادر والجرد' },
  { key: 'data_entry', name: 'موظف إدخال', description: 'إدارة البيانات الأساسية ومساعدة إدخال العمليات' },
  { key: 'readonly', name: 'قراءة فقط', description: 'عرض البيانات والتقارير دون تعديل' },
];

export const permissionDefinitions: PermissionDefinition[] = [
  { code: 'Dashboard.View', nameAr: 'عرض لوحة التحكم', module: 'الرئيسية', description: 'الدخول إلى لوحة التحكم' },
  { code: 'Items.View', nameAr: 'عرض الأصناف', module: 'الأصناف', description: 'عرض قائمة الأصناف وبياناتها' },
  { code: 'Items.Create', nameAr: 'إضافة صنف', module: 'الأصناف', description: 'إضافة أصناف جديدة' },
  { code: 'Items.Edit', nameAr: 'تعديل صنف', module: 'الأصناف', description: 'تعديل بيانات الأصناف' },
  { code: 'Items.Disable', nameAr: 'تعطيل صنف', module: 'الأصناف', description: 'تعطيل صنف بدل الحذف' },
  { code: 'MasterData.View', nameAr: 'عرض البيانات الأساسية', module: 'البيانات الأساسية', description: 'عرض التصنيفات والوحدات والموردين والجهات' },
  { code: 'MasterData.Manage', nameAr: 'إدارة البيانات الأساسية', module: 'البيانات الأساسية', description: 'إضافة وتعديل وتعطيل البيانات الأساسية' },
  { code: 'Warehouses.View', nameAr: 'عرض المستودعات', module: 'المستودعات', description: 'عرض المستودعات ومواقع التخزين' },
  { code: 'Warehouses.Create', nameAr: 'إضافة مستودع', module: 'المستودعات', description: 'إضافة مستودعات جديدة' },
  { code: 'Locations.View', nameAr: 'عرض مواقع التخزين', module: 'مواقع التخزين', description: 'عرض المواقع والأرفف والخانات' },
  { code: 'Locations.Create', nameAr: 'إضافة موقع تخزين', module: 'مواقع التخزين', description: 'إضافة مواقع تخزين جديدة' },
  { code: 'Stock.View', nameAr: 'عرض المخزون الحالي', module: 'المخزون', description: 'عرض الكميات الحالية' },
  { code: 'StockMovements.View', nameAr: 'عرض حركات المخزون', module: 'المخزون', description: 'عرض سجل الحركات' },
  { code: 'LowStock.View', nameAr: 'عرض تنبيهات الحد الأدنى', module: 'المخزون', description: 'عرض الأصناف تحت الحد الأدنى واقتراح إعادة التوريد' },
  { code: 'Inbound.View', nameAr: 'عرض الوارد', module: 'الوارد', description: 'عرض مستندات الوارد' },
  { code: 'Inbound.Create', nameAr: 'إنشاء وارد', module: 'الوارد', description: 'إنشاء مستند وارد' },
  { code: 'Inbound.Cancel', nameAr: 'إلغاء وارد', module: 'الوارد', description: 'إلغاء مستند وارد وفق قواعد النظام' },
  { code: 'Outbound.View', nameAr: 'عرض الصادر', module: 'الصادر', description: 'عرض مستندات الصادر' },
  { code: 'Outbound.Create', nameAr: 'إنشاء صادر', module: 'الصادر', description: 'إنشاء مستند صادر' },
  { code: 'Outbound.Cancel', nameAr: 'إلغاء صادر', module: 'الصادر', description: 'إلغاء صادر وفق قواعد النظام' },
  { code: 'InventoryCount.View', nameAr: 'عرض الجرد', module: 'الجرد', description: 'عرض عمليات الجرد' },
  { code: 'InventoryCount.Create', nameAr: 'إنشاء جرد', module: 'الجرد', description: 'إنشاء جلسة جرد' },
  { code: 'Reports.View', nameAr: 'عرض التقارير', module: 'التقارير', description: 'عرض وطباعة وتصدير التقارير' },
  { code: 'Users.Manage', nameAr: 'إدارة المستخدمين', module: 'الإدارة', description: 'إضافة وتعطيل المستخدمين وتغيير أدوارهم' },
  { code: 'Permissions.Manage', nameAr: 'إدارة الصلاحيات', module: 'الإدارة', description: 'تعديل صلاحيات الأدوار' },
  { code: 'AuditLog.View', nameAr: 'عرض سجل النشاط', module: 'الإدارة', description: 'عرض سجل النشاط والتتبع' },
  { code: 'Settings.Manage', nameAr: 'إدارة الإعدادات', module: 'الإعدادات', description: 'تعديل إعدادات النظام' },
  { code: 'Backup.Manage', nameAr: 'إدارة النسخ الاحتياطي', module: 'الإعدادات', description: 'إنشاء واستعادة النسخ الاحتياطية' },
];

const adminAll = permissionDefinitions.map((p) => p.code);
const viewOnly = permissionDefinitions.filter((p) => p.code.endsWith('.View')).map((p) => p.code);

export const defaultRolePermissions: Record<RoleKey, string[]> = {
  admin: adminAll,
  manager: [
    ...viewOnly,
    'Inbound.Create', 'Inbound.Cancel',
    'Outbound.Create', 'Outbound.Cancel',
    'InventoryCount.Create',
    'AuditLog.View', 'Backup.Manage',
  ],
  storekeeper: [
    ...viewOnly,
    'Inbound.Create', 'Outbound.Create', 'InventoryCount.Create',
  ],
  data_entry: [
    ...viewOnly,
    'Items.Create', 'Items.Edit', 'MasterData.Manage', 'Inbound.Create', 'Outbound.Create',
  ],
  readonly: viewOnly,
};

export function roleName(role: RoleKey) {
  return roleDefinitions.find((r) => r.key === role)?.name ?? role;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getRoles() {
  return roleDefinitions;
}

export function getRolePermissions(): Record<RoleKey, string[]> {
  return readJson(ROLE_PERMISSIONS_KEY, defaultRolePermissions);
}

export function saveRolePermissions(value: Record<RoleKey, string[]>) {
  writeJson(ROLE_PERMISSIONS_KEY, value);
}

export function toggleRolePermission(role: RoleKey, permissionCode: string, enabled: boolean) {
  const permissions = getRolePermissions();
  const current = new Set(permissions[role] ?? []);
  if (enabled) current.add(permissionCode);
  else current.delete(permissionCode);
  permissions[role] = Array.from(current);
  saveRolePermissions(permissions);
  return permissions;
}

export function hasRolePermission(role: RoleKey, permissionCode: string) {
  if (role === 'admin') return true;
  return (getRolePermissions()[role] ?? []).includes(permissionCode);
}

export const routePermissions: Record<string, string> = {
  '/': 'Dashboard.View',
  '/items': 'Items.View',
  '/categories': 'MasterData.View',
  '/units': 'MasterData.View',
  '/suppliers': 'MasterData.View',
  '/recipients': 'MasterData.View',
  '/warehouses': 'Warehouses.View',
  '/locations': 'Locations.View',
  '/stock': 'Stock.View',
  '/movements': 'StockMovements.View',
  '/movement': 'StockMovements.View',
  '/low-stock': 'LowStock.View',
  '/incoming': 'Inbound.View',
  '/outgoing': 'Outbound.View',
  '/inventory': 'InventoryCount.View',
  '/reports': 'Reports.View',
  '/users': 'Users.Manage',
  '/permissions': 'Permissions.Manage',
  '/activity': 'AuditLog.View',
  '/settings': 'Settings.Manage',
  '/backup': 'Backup.Manage',
};
