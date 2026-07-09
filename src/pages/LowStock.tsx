import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, Filter, PackagePlus, Printer, RefreshCw } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import SearchBox from '../components/SearchBox';
import DataGrid from '../components/DataGrid';
import { api } from '../lib/api';
import { exportCsv, safePrint, showToast } from '../lib/uiActions';

type LowStockRow = {
  id: number;
  item_name: string;
  warehouse: string;
  location: string;
  qty_available: number;
  min_qty: number;
  shortage_qty: number;
  suggested_qty: number;
  status: 'out' | 'low';
};

export default function LowStock() {
  const [rows, setRows] = useState<LowStockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyOut, setOnlyOut] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [items, currentStock] = await Promise.all([api.items(), api.currentStock()]);
      const itemByName = new Map<string, any>();
      items.forEach((item: any) => itemByName.set(String(item.name), item));

      const lowRows: LowStockRow[] = currentStock
        .map((stock: any) => {
          const item = itemByName.get(String(stock.item_name)) ?? {};
          const available = Number(stock.qty_available ?? item.current_qty ?? 0);
          const minQty = Number(item.min_qty ?? 0);
          const maxQty = Number(item.max_qty ?? (minQty * 2));
          const shortage = Math.max(minQty - available, 0);
          const suggested = Math.max(maxQty - available, shortage);
          return {
            id: Number(stock.id),
            item_name: String(stock.item_name ?? item.name ?? ''),
            warehouse: String(stock.warehouse ?? ''),
            location: String(stock.location ?? ''),
            qty_available: available,
            min_qty: minQty,
            shortage_qty: shortage,
            suggested_qty: suggested,
            status: available <= 0 ? 'out' : 'low',
          };
        })
        .filter((row: LowStockRow) => row.min_qty > 0 && row.qty_available <= row.min_qty)
        .sort((a: LowStockRow, b: LowStockRow) => b.shortage_qty - a.shortage_qty);

      setRows(lowRows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !q || [row.item_name, row.warehouse, row.location]
        .some((value) => String(value || '').toLowerCase().includes(q));
      const matchesOut = !onlyOut || row.qty_available <= 0;
      return matchesSearch && matchesOut;
    });
  }, [rows, search, onlyOut]);

  const outCount = rows.filter((row) => row.qty_available <= 0).length;
  const shortageTotal = filtered.reduce((sum, row) => sum + row.shortage_qty, 0);

  const columns = [
    { key: 'item_name', header: 'الصنف', width: '220px' },
    { key: 'warehouse', header: 'المستودع', width: '150px' },
    { key: 'location', header: 'الموقع', width: '210px' },
    { key: 'qty_available', header: 'المتاح', width: '90px' },
    { key: 'min_qty', header: 'الحد الأدنى', width: '100px' },
    { key: 'shortage_qty', header: 'النقص', width: '90px' },
    { key: 'suggested_qty', header: 'اقتراح إعادة توريد', width: '140px' },
    { key: 'status', header: 'الحالة', width: '120px', render: (row: LowStockRow) => (
      <span className={`px-2 py-1 text-xs font-bold border ${row.status === 'out' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
        {row.status === 'out' ? 'منتهي' : 'تحت الحد'}
      </span>
    ) },
  ];

  return (
    <div className="space-y-4">
      <Toolbar title="تنبيهات الحد الأدنى Low Stock">
        <button onClick={() => void load()} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><RefreshCw className="w-4 h-4" />تحديث</button>
        <button onClick={() => exportCsv('low-stock-alerts', filtered as unknown as Record<string, unknown>[])} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><Download className="w-4 h-4" />تصدير</button>
        <button onClick={() => safePrint('تنبيهات الحد الأدنى')} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><Printer className="w-4 h-4" />طباعة</button>
        <button onClick={() => showToast('تم تجهيز اقتراحات إعادة التوريد حسب الكميات الحالية والحد الأدنى.')} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded"><PackagePlus className="w-4 h-4" />اقتراح إعادة توريد</button>
      </Toolbar>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
          <div className="text-xs text-slate-500">أصناف تحت الحد الأدنى</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{rows.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
          <div className="text-xs text-slate-500">أصناف منتهية الكمية</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{outCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
          <div>
            <div className="text-xs text-slate-500">إجمالي النقص في النتائج</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{shortageTotal}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <SearchBox value={search} onChange={setSearch} placeholder="بحث بالصنف، المستودع أو الموقع" />
          <Filter className="w-4 h-4 text-slate-400" />
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={onlyOut} onChange={(e) => setOnlyOut(e.target.checked)} />
            عرض المنتهي فقط
          </label>
          <div className="mr-auto text-xs text-slate-500">عدد السجلات: <span className="font-bold text-slate-700">{filtered.length}</span></div>
        </div>
        <DataGrid columns={columns} data={filtered} loading={loading} />
      </div>
    </div>
  );
}
