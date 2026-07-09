import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, Shield, Trash2, UserCog, UserMinus } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import SearchBox from '../components/SearchBox';
import DataGrid from '../components/DataGrid';
import StatusBadge from '../components/StatusBadge';
import { AuthUser, RoleKey, getRoles } from '../auth/authData';
import {
  createBackendUser,
  deleteBackendUser,
  disableBackendUser,
  listBackendUsers,
  updateBackendUser,
} from '../auth/authClient';
import { useAuth } from '../auth/AuthContext';

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ full_name: '', username: '', password: '', role: 'storekeeper' as RoleKey });

  const roles = getRoles();
  const filtered = users.filter((row) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || row.full_name.toLowerCase().includes(q) || row.username.toLowerCase().includes(q) || row.role_name.toLowerCase().includes(q);
    const matchesRole = !role || row.role === role;
    return matchesSearch && matchesRole;
  });

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listBackendUsers();
      setUsers(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await createBackendUser(form);
      setForm({ full_name: '', username: '', password: '', role: 'storekeeper' });
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إضافة المستخدم');
    }
  };

  const activeCount = users.filter((u) => u.status === 'active').length;
  const roleCount = useMemo(() => new Set(users.map((u) => u.role)).size, [users]);

  const columns = [
    { key: 'full_name', header: 'الاسم الكامل', width: '210px' },
    { key: 'username', header: 'اسم المستخدم', width: '170px' },
    { key: 'role_name', header: 'الدور', width: '160px' },
    { key: 'status', header: 'الحالة', width: '100px', render: (row: AuthUser) => <StatusBadge status={row.status === 'active' ? 'active' : 'inactive'} /> },
    { key: 'last_login_at', header: 'آخر دخول', width: '180px', render: (row: AuthUser) => row.last_login_at ? new Date(row.last_login_at).toLocaleString('ar-SA') : '-' },
    {
      key: 'actions',
      header: 'إجراءات',
      width: '330px',
      render: (row: AuthUser) => (
        <div className="flex items-center gap-2">
          <select
            value={row.role}
            onChange={(e) => { void updateBackendUser(row.id, { role: e.target.value as RoleKey }).then(refresh).catch((err) => setError(err instanceof Error ? err.message : 'تعذر تحديث المستخدم')); }}
            className="border border-slate-300 bg-white px-2 py-1 text-xs"
            disabled={row.id === user?.id}
            title={row.id === user?.id ? 'لا يمكن تغيير دور المستخدم الحالي من هذه الشاشة' : 'تغيير الدور'}
          >
            {roles.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
          </select>
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 border bg-orange-50 text-orange-700 text-xs disabled:opacity-50"
            disabled={row.id === user?.id || row.status !== 'active'}
            onClick={() => { if (confirm('هل تريد تعطيل هذا المستخدم؟')) { void disableBackendUser(row.id).then(refresh).catch((err) => setError(err instanceof Error ? err.message : 'تعذر تعطيل المستخدم')); } }}
          >
            <UserMinus className="w-3.5 h-3.5" /> تعطيل
          </button>
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 border bg-red-50 text-red-700 text-xs disabled:opacity-50"
            disabled={row.id === user?.id}
            onClick={() => { if (confirm('هل تريد حذف هذا المستخدم من النظام؟')) { void deleteBackendUser(row.id).then(refresh).catch((err) => setError(err instanceof Error ? err.message : 'تعذر حذف المستخدم')); } }}
          >
            <Trash2 className="w-3.5 h-3.5" /> حذف
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Toolbar title="المستخدمون وتسجيل الدخول">
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded">
          <Plus className="w-4 h-4" />مستخدم جديد
        </button>
      </Toolbar>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex items-center gap-3"><UserCog className="w-8 h-8 text-teal-600" /><div><div className="text-xs text-slate-500">عدد المستخدمين</div><div className="text-2xl font-bold text-slate-800">{users.length}</div></div></div>
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex items-center gap-3"><Shield className="w-8 h-8 text-blue-600" /><div><div className="text-xs text-slate-500">مستخدمون فعالون</div><div className="text-2xl font-bold text-slate-800">{activeCount}</div></div></div>
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm text-xs text-slate-500 leading-relaxed">يمكن تعطيل المستخدمين للحفاظ على سجل العمليات، ويمكن حذف المستخدمين التجريبيين من النظام عند الحاجة. عدد الأدوار المستخدمة: <strong>{roleCount}</strong></div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded p-4 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <label className="text-sm"><span className="block mb-1">الاسم الكامل</span><input className="w-full border px-2 py-1.5" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>
          <label className="text-sm"><span className="block mb-1">اسم المستخدم</span><input className="w-full border px-2 py-1.5" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
          <label className="text-sm"><span className="block mb-1">كلمة المرور</span><input type="password" className="w-full border px-2 py-1.5" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          <label className="text-sm"><span className="block mb-1">الدور</span><select className="w-full border px-2 py-1.5" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as RoleKey })}>{roles.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}</select></label>
          <button type="submit" className="px-3 py-1.5 bg-teal-600 text-white text-sm">حفظ المستخدم</button>
          {error && <div className="md:col-span-5 text-red-700 text-sm bg-red-50 border border-red-200 p-2">{error}</div>}
        </form>
      )}

      {!showForm && error && <div className="text-red-700 text-sm bg-red-50 border border-red-200 p-2">{error}</div>}

      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <SearchBox value={search} onChange={setSearch} placeholder="بحث باسم المستخدم أو الدور" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 bg-white text-sm">
            <option value="">كل الأدوار</option>
            {roles.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
          </select>
          <div className="mr-auto text-xs text-slate-500">عدد النتائج: <span className="font-bold text-slate-700">{filtered.length}</span></div>
        </div>
        <DataGrid columns={columns} data={filtered} loading={loading} />
      </div>
    </div>
  );
}
