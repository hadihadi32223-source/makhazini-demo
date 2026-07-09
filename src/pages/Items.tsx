import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Filter, Printer, FileDown, Edit, Eye, Power, Trash2, Upload } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import SearchBox from '../components/SearchBox';
import DataGrid from '../components/DataGrid';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';
import { detailsMessage, disabledMessage, exportCsv, hardDeletedMessage } from '../lib/uiActions';
import { printCompanyDocument } from '../lib/companyPrint';
import { readSpreadsheetRows } from '../lib/spreadsheetImport';
import { mapItemImportRow } from '../lib/importMappings';

interface Item {
  id: number;
  name: string;
  category: string;
  unit: string;
  min_qty: number;
  max_qty: number;
  tracking_method: string;
  status: string;
  current_qty: number;
  notes?: string;
}

const trackingLabels: Record<string, string> = {
  none: 'بدون تتبع',
  batch: 'Batch Number',
  serial: 'Serial Number',
  expiry: 'تاريخ انتهاء',
};

function cleanItemRows(rows: Item[]) {
  return rows.map((item) => ({
    'اسم الصنف': item.name,
    'التصنيف': item.category,
    'الوحدة': item.unit,
    'الكمية': Number(item.current_qty || 0),
    'الحد الأدنى': Number(item.min_qty || 0),
    'الحد الأعلى': Number(item.max_qty || 0),
    'طريقة التتبع': trackingLabels[item.tracking_method] || item.tracking_method || 'بدون تتبع',
    'الحالة': item.status === 'inactive' ? 'معطّل' : 'مفعّل',
    'ملاحظات': item.notes || '',
  }));
}

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await api.items();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchItems(); }, []);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q ||
        String(i.name || '').toLowerCase().includes(q) ||
        String(i.category || '').toLowerCase().includes(q) ||
        String(i.unit || '').toLowerCase().includes(q);
      const matchesCategory = !categoryFilter || i.category === categoryFilter;
      const matchesStatus = !statusFilter || i.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, search, categoryFilter, statusFilter]);

  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category).filter(Boolean))), [items]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      if (editing) {
        await api.updateItem({ ...body, id: editing.id });
      } else {
        await api.createItem(body);
      }
      setShowForm(false);
      setEditing(null);
      void fetchItems();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    try {
      const spreadsheetRows = await readSpreadsheetRows(file);
      const mapped = spreadsheetRows.map(mapItemImportRow).filter((row) => String(row.name || '').trim());
      if (!mapped.length) {
        window.alert('لم يتم العثور على أصناف صالحة للاستيراد. تأكد من وجود عمود اسم الصنف والكمية.');
        return;
      }
      for (const row of mapped) await api.createItem(row);
      await fetchItems();
      window.alert(`تم استيراد ${mapped.length} صنف بنجاح.`);
    } catch (error) {
      window.alert((error as Error).message);
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const printItemsInvoice = (rows: Item[] = filtered) => {
    printCompanyDocument({
      title: 'فاتورة البضائع',
      documentLabel: 'فاتورة رسمية خاصة بالبضائع والأصناف',
      meta: [
        { label: 'عدد الأصناف', value: rows.length },
        { label: 'التصنيف', value: categoryFilter || 'جميع التصنيفات' },
        { label: 'الحالة', value: statusFilter || 'جميع الحالات' },
      ],
      columns: [
        { key: 'name', header: 'اسم الصنف' },
        { key: 'category', header: 'التصنيف' },
        { key: 'unit', header: 'الوحدة' },
        { key: 'current_qty', header: 'الكمية', align: 'center' },
        { key: 'min_qty', header: 'الحد الأدنى', align: 'center' },
        { key: 'max_qty', header: 'الحد الأعلى', align: 'center' },
        { key: 'status', header: 'الحالة', align: 'center' },
      ],
      rows: rows as unknown as Record<string, unknown>[],
      summary: [
        { label: 'عدد الأصناف', value: rows.length },
        { label: 'إجمالي الكمية', value: rows.reduce((sum, item) => sum + Number(item.current_qty || 0), 0) },
      ],
    });
  };

  const columns = [
    { key: 'name', header: 'اسم الصنف', width: '260px' },
    { key: 'category', header: 'التصنيف', width: '140px' },
    { key: 'unit', header: 'الوحدة', width: '100px' },
    { key: 'current_qty', header: 'الكمية', width: '90px' },
    { key: 'min_qty', header: 'الحد الأدنى', width: '100px' },
    { key: 'max_qty', header: 'الحد الأعلى', width: '100px' },
    { key: 'tracking_method', header: 'طريقة التتبع', width: '120px', render: (row: Item) => trackingLabels[row.tracking_method] || row.tracking_method },
    { key: 'status', header: 'الحالة', width: '90px', render: (row: Item) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'إجراءات',
      width: '170px',
      render: (row: Item) => (
        <div className="flex items-center gap-1">
          <button onClick={() => detailsMessage('بيانات الصنف', `${row.name}\nالتصنيف: ${row.category || '-'}\nالوحدة: ${row.unit || '-'}\nالكمية: ${row.current_qty}`)} className="p-1 rounded hover:bg-slate-100 text-slate-600" title="عرض"><Eye className="w-4 h-4" /></button>
          <button onClick={() => { setEditing(row); setShowForm(true); }} className="p-1 rounded hover:bg-blue-50 text-blue-600" title="تعديل"><Edit className="w-4 h-4" /></button>
          <button onClick={() => { if (window.confirm('هل تريد تعطيل هذا الصنف؟')) void api.deleteItem(row.id).then(() => { disabledMessage(); return fetchItems(); }); }} className="p-1 rounded hover:bg-orange-50 text-orange-600" title="تعطيل"><Power className="w-4 h-4" /></button>
          <button onClick={() => { if (window.confirm('هل تريد حذف هذا الصنف نهائيًا من النسخة المحلية؟')) void api.hardDeleteItem(row.id).then(() => { hardDeletedMessage(); return fetchItems(); }); }} className="p-1 rounded hover:bg-red-50 text-red-600" title="حذف"><Trash2 className="w-4 h-4" /></button>
          <button onClick={() => printItemsInvoice([row])} className="p-1 rounded hover:bg-slate-100 text-slate-600" title="طباعة"><Printer className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Toolbar title="إدارة الأصناف">
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded"
        >
          <Plus className="w-4 h-4" />
          صنف جديد
        </button>
        <button onClick={() => printItemsInvoice()} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50">
          <Printer className="w-4 h-4" />
          طباعة
        </button>
        <button onClick={() => exportCsv('الأصناف', cleanItemRows(filtered))} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50">
          <FileDown className="w-4 h-4" />
          تصدير
        </button>
        <button onClick={() => importInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50">
          <Upload className="w-4 h-4" />
          استيراد من Excel
        </button>
        <input ref={importInputRef} type="file" accept=".xlsx,.csv,.tsv,.txt" className="hidden" onChange={(e) => void handleImport(e.target.files?.[0])} />
      </Toolbar>

      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <SearchBox value={search} onChange={setSearch} placeholder="بحث باسم الصنف، التصنيف أو الوحدة" />
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="w-4 h-4" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1.5 bg-white"
            >
              <option value="">جميع التصنيفات</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1.5 bg-white"
            >
              <option value="">جميع الحالات</option>
              <option value="active">مفعّل</option>
              <option value="inactive">معطّل</option>
            </select>
          </div>
          <div className="mr-auto text-xs text-slate-500">
            عدد التسجيلات: <span className="font-bold text-slate-700">{filtered.length}</span>
          </div>
        </div>
        <DataGrid columns={columns} data={filtered} loading={loading} />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{editing ? 'تعديل صنف' : 'صنف جديد'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleSave} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">اسم الصنف</label>
                <input name="name" defaultValue={editing?.name} required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">الكمية</label>
                <input name="current_qty" type="number" min="0" step="1" defaultValue={editing?.current_qty ?? 0} required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">التصنيف</label>
                <input name="category" defaultValue={editing?.category} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">الوحدة</label>
                <input name="unit" defaultValue={editing?.unit} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">الحد الأدنى</label>
                <input name="min_qty" type="number" defaultValue={editing?.min_qty ?? 0} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">الحد الأعلى</label>
                <input name="max_qty" type="number" defaultValue={editing?.max_qty ?? 0} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">طريقة التتبع</label>
                <select name="tracking_method" defaultValue={editing?.tracking_method || 'none'} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="none">بدون تتبع</option>
                  <option value="batch">Batch Number</option>
                  <option value="serial">Serial Number</option>
                  <option value="expiry">تاريخ انتهاء</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">الحالة</label>
                <select name="status" defaultValue={editing?.status || 'active'} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="active">مفعّل</option>
                  <option value="inactive">معطّل</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">ملاحظات</label>
                <textarea name="notes" defaultValue={editing?.notes || ''} rows={2} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-3 flex justify-end gap-2 pt-2">
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
