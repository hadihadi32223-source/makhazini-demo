import { useEffect, useMemo, useState } from 'react';
import { Plus, Printer, FileDown, Edit, Eye, Power, Trash2 } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import SearchBox from '../components/SearchBox';
import DataGrid from '../components/DataGrid';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';
import { detailsMessage, disabledMessage, exportCsv, hardDeletedMessage, safePrint } from '../lib/uiActions';

interface Location {
  id: number;
  warehouse: string;
  zone: string;
  aisle: string;
  rack: string;
  level: string;
  bin: string;
  capacity: number;
  status: string;
}

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [primaryWarehouse, setPrimaryWarehouse] = useState('');

  const fetch = async () => {
    try {
      const [warehouseRows, locationRows] = await Promise.all([api.warehouses(), api.locations()]);
      setPrimaryWarehouse(String(warehouseRows?.[0]?.name ?? ''));
      setLocations(locationRows);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return locations.filter((l) =>
      !q || l.warehouse.toLowerCase().includes(q) || l.zone.toLowerCase().includes(q) ||
      l.aisle.toLowerCase().includes(q) || l.rack.toLowerCase().includes(q) || l.bin.toLowerCase().includes(q)
    );
  }, [locations, search]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = { ...Object.fromEntries(form.entries()), warehouse: primaryWarehouse || editing?.warehouse || '' };
    try {
      if (editing) await api.updateLocation({ ...body, id: editing.id });
      else await api.createLocation(body);
      setShowForm(false); setEditing(null); fetch();
    } catch (err) { alert((err as Error).message); }
  };

  const columns = [
    { key: 'warehouse', header: 'المستودع', width: '160px' },
    { key: 'zone', header: 'المنطقة Zone', width: '100px' },
    { key: 'aisle', header: 'الممر Aisle', width: '100px' },
    { key: 'rack', header: 'الرف Rack', width: '100px' },
    { key: 'level', header: 'المستوى Level', width: '100px' },
    { key: 'bin', header: 'الخانة Bin', width: '100px' },
    { key: 'capacity', header: 'السعة', width: '90px' },
    { key: 'status', header: 'الحالة', width: '100px', render: (row: Location) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'إجراءات',
      width: '170px',
      render: (row: Location) => (
        <div className="flex items-center gap-1">
          <button onClick={() => detailsMessage('بيانات الموقع', `${row.warehouse}\n${row.zone}-${row.aisle}-${row.rack}-${row.level}-${row.bin}`)} className="p-1 rounded hover:bg-slate-100 text-slate-600" title="عرض"><Eye className="w-4 h-4" /></button>
          <button onClick={() => { setEditing(row); setShowForm(true); }} className="p-1 rounded hover:bg-blue-50 text-blue-600" title="تعديل"><Edit className="w-4 h-4" /></button>
          <button onClick={() => { if (window.confirm('هل تريد تعطيل هذا الموقع؟')) void api.deleteLocation(row.id).then(() => { disabledMessage(); return fetch(); }); }} className="p-1 rounded hover:bg-orange-50 text-orange-600" title="تعطيل"><Power className="w-4 h-4" /></button>
          <button onClick={() => { if (window.confirm('هل تريد حذف هذا الموقع نهائيًا من النسخة المحلية؟')) void api.hardDeleteLocation(row.id).then(() => { hardDeletedMessage(); return fetch(); }); }} className="p-1 rounded hover:bg-red-50 text-red-600" title="حذف"><Trash2 className="w-4 h-4" /></button>
          <button onClick={() => safePrint(`إدارة مواقع التخزين`)} className="p-1 rounded hover:bg-slate-100 text-slate-600" title="طباعة"><Printer className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Toolbar title="إدارة مواقع التخزين">
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded"><Plus className="w-4 h-4" />موقع جديد</button>
        <button onClick={() => safePrint('إدارة مواقع التخزين')} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><Printer className="w-4 h-4" />طباعة</button>
        <button onClick={() => exportCsv('إدارة مواقع التخزين', filtered as unknown as Record<string, unknown>[])} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><FileDown className="w-4 h-4" />تصدير</button>
      </Toolbar>

      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <SearchBox value={search} onChange={setSearch} placeholder="بحث بالمستودع أو الخانة أو الممر" />
          <div className="mr-auto text-xs text-slate-500">عدد التسجيلات: <span className="font-bold text-slate-700">{filtered.length}</span></div>
        </div>
        <DataGrid columns={columns} data={filtered} loading={loading} />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-2xl">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{editing ? 'تعديل موقع' : 'موقع تخزين جديد'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleSave} className="p-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">المستودع</label>
                <input name="warehouse" value={primaryWarehouse || editing?.warehouse || ''} readOnly required className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">السعة</label>
                <input name="capacity" type="number" defaultValue={editing?.capacity} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">المنطقة Zone</label>
                <input name="zone" defaultValue={editing?.zone} required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">الممر Aisle</label>
                <input name="aisle" defaultValue={editing?.aisle} required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">الرف Rack</label>
                <input name="rack" defaultValue={editing?.rack} required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">المستوى Level</label>
                <input name="level" defaultValue={editing?.level} required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">الخانة Bin</label>
                <input name="bin" defaultValue={editing?.bin} required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">الحالة</label>
                <select name="status" defaultValue={editing?.status || 'active'} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="active">مفعّل</option>
                  <option value="inactive">معطّل</option>
                </select>
              </div>
              <div className="col-span-2 flex justify-end gap-2 pt-2">
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
