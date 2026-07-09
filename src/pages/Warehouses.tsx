import { useEffect, useMemo, useState } from 'react';
import { Printer, FileDown, Edit, Eye } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import SearchBox from '../components/SearchBox';
import DataGrid from '../components/DataGrid';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';
import { detailsMessage, exportCsv, safePrint } from '../lib/uiActions';

interface Warehouse {
  id: number;
  code: string;
  name: string;
  location: string;
  manager: string;
  status: string;
}

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);

  const fetch = async () => {
    try {
      setLoading(true);
      const data = await api.warehouses();
      setWarehouses((data as Warehouse[]).slice(0, 1).map((item) => ({ ...item, status: 'active' })));
    } finally { setLoading(false); }
  };

  useEffect(() => { void fetch(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return warehouses.filter((w) =>
      !q || w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q) || w.location.toLowerCase().includes(q)
    );
  }, [warehouses, search]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      await api.updateWarehouse({ id: editing.id, name: body.name, manager: body.manager, status: 'active' });
      setShowForm(false);
      setEditing(null);
      void fetch();
    } catch (err) { alert((err as Error).message); }
  };

  const openEdit = (warehouse: Warehouse) => {
    setEditing({ ...warehouse, status: 'active' });
    setShowForm(true);
  };

  const columns = [
    { key: 'code', header: 'كود المستودع', width: '120px' },
    { key: 'name', header: 'اسم المستودع', width: '220px' },
    { key: 'location', header: 'الموقع', width: '220px' },
    { key: 'manager', header: 'المدير', width: '160px' },
    { key: 'status', header: 'الحالة', width: '100px', render: () => <StatusBadge status="active" /> },
    {
      key: 'actions',
      header: 'إجراءات',
      width: '130px',
      render: (row: Warehouse) => (
        <div className="flex items-center gap-1">
          <button onClick={() => detailsMessage('بيانات المستودع', `${row.name}\nالكود: ${row.code}\nالموقع: ${row.location}\nالحالة: مفعّل`)} className="p-1 rounded hover:bg-slate-100 text-slate-600" title="عرض"><Eye className="w-4 h-4" /></button>
          <button onClick={() => openEdit(row)} className="p-1 rounded hover:bg-blue-50 text-blue-600" title="تعديل"><Edit className="w-4 h-4" /></button>
          <button onClick={() => safePrint(`إدارة المستودعات`)} className="p-1 rounded hover:bg-slate-100 text-slate-600" title="طباعة"><Printer className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Toolbar title="إدارة المستودعات">
        <button onClick={() => safePrint('إدارة المستودعات')} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><Printer className="w-4 h-4" />طباعة</button>
        <button onClick={() => exportCsv('إدارة المستودعات', filtered as unknown as Record<string, unknown>[])} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><FileDown className="w-4 h-4" />تصدير</button>
      </Toolbar>

      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <SearchBox value={search} onChange={setSearch} placeholder="بحث باسم أو كود المستودع" />
          <div className="mr-auto text-xs text-slate-500">عدد التسجيلات: <span className="font-bold text-slate-700">{filtered.length}</span></div>
        </div>
        <DataGrid columns={columns} data={filtered} loading={loading} />
      </div>

      {showForm && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-lg">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">تعديل المستودع الرئيسي</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">كود المستودع</label>
                  <input value={editing.code} disabled className="w-full border border-slate-200 bg-slate-50 rounded px-3 py-2 text-sm text-slate-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">اسم المستودع</label>
                  <input name="name" defaultValue={editing.name} required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">الموقع</label>
                <input value={editing.location || ''} disabled className="w-full border border-slate-200 bg-slate-50 rounded px-3 py-2 text-sm text-slate-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">المدير</label>
                  <input name="manager" defaultValue={editing.manager} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">الحالة</label>
                  <input value="مفعّل" disabled className="w-full border border-slate-200 bg-slate-50 rounded px-3 py-2 text-sm text-slate-500" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 rounded text-sm hover:bg-slate-50">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded text-sm hover:bg-teal-700">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
