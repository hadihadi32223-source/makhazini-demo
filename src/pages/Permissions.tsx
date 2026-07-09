import { useMemo, useState } from 'react';
import { LockKeyhole, RotateCcw, Save } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import SearchBox from '../components/SearchBox';
import DataGrid from '../components/DataGrid';
import {
  RoleKey,
  defaultRolePermissions,
  getRolePermissions,
  getRoles,
  permissionDefinitions,
  saveRolePermissions,
} from '../auth/authData';

type PermissionRow = {
  id: number;
  code: string;
  module: string;
  nameAr: string;
  description: string;
};

export default function Permissions() {
  const roles = getRoles();
  const [rolePermissions, setRolePermissions] = useState(() => getRolePermissions());
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [saved, setSaved] = useState(false);

  const rows: PermissionRow[] = permissionDefinitions.map((p, index) => ({ id: index + 1, ...p }));
  const modules = useMemo(() => Array.from(new Set(rows.map((row) => row.module))), [rows]);
  const filtered = rows.filter((row) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || row.module.toLowerCase().includes(q) || row.nameAr.toLowerCase().includes(q) || row.code.toLowerCase().includes(q);
    const matchesModule = !moduleFilter || row.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const isChecked = (role: RoleKey, code: string) => role === 'admin' || (rolePermissions[role] ?? []).includes(code);
  const toggle = (role: RoleKey, code: string, enabled: boolean) => {
    if (role === 'admin') return;
    setRolePermissions((current) => {
      const next = { ...current, [role]: [...(current[role] ?? [])] };
      const set = new Set(next[role]);
      if (enabled) set.add(code);
      else set.delete(code);
      next[role] = Array.from(set);
      return next;
    });
    setSaved(false);
  };

  const save = () => {
    saveRolePermissions(rolePermissions);
    setSaved(true);
  };

  const reset = () => {
    saveRolePermissions(defaultRolePermissions);
    setRolePermissions(defaultRolePermissions);
    setSaved(true);
  };

  const columns = [
    { key: 'module', header: 'الوحدة', width: '150px' },
    { key: 'nameAr', header: 'الصلاحية', width: '190px' },
    { key: 'code', header: 'الكود', width: '210px' },
    ...roles.map((role) => ({
      key: role.key,
      header: role.name,
      width: '125px',
      render: (row: PermissionRow) => (
        <label className="inline-flex items-center justify-center w-full cursor-pointer">
          <input
            type="checkbox"
            checked={isChecked(role.key, row.code)}
            disabled={role.key === 'admin'}
            onChange={(e) => toggle(role.key, row.code, e.target.checked)}
            className="w-4 h-4"
          />
        </label>
      ),
    })),
  ];

  return (
    <div className="space-y-4">
      <Toolbar title="الصلاحيات">
        <button onClick={save} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded"><Save className="w-4 h-4" />حفظ الصلاحيات</button>
        <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium rounded"><RotateCcw className="w-4 h-4" />استعادة الافتراضي</button>
      </Toolbar>
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex items-start gap-3">
        <LockKeyhole className="w-6 h-6 text-teal-600 mt-0.5" />
        <p className="text-sm text-slate-600 leading-relaxed">
          هذه الشاشة تتحكم بما يظهر للمستخدم وما يستطيع فعله. مدير النظام لديه كل الصلاحيات دائمًا. بعد الحفظ، سجّل خروج ودخول بالحساب المطلوب لتجربة الصلاحيات.
        </p>
      </div>
      {saved && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2 text-sm">تم حفظ الصلاحيات بنجاح.</div>}
      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <SearchBox value={search} onChange={setSearch} placeholder="بحث بالوحدة أو الصلاحية أو الكود" />
          <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 bg-white text-sm">
            <option value="">كل الوحدات</option>
            {modules.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="mr-auto text-xs text-slate-500">عدد الصلاحيات: <span className="font-bold text-slate-700">{filtered.length}</span></div>
        </div>
        <DataGrid columns={columns} data={filtered} loading={false} />
      </div>
    </div>
  );
}
