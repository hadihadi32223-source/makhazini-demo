import { useEffect, useMemo, useState } from 'react';
import { Calendar, FileDown, Printer } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import SearchBox from '../components/SearchBox';
import DataGrid from '../components/DataGrid';
import { api } from '../lib/api';
import { exportCsv, safePrint } from '../lib/uiActions';

type MovementRow = {
  id: number;
  movement_no: string;
  movement_date: string;
  item_name: string;
  warehouse: string;
  location: string;
  movement_type: string;
  qty_in: number;
  qty_out: number;
  balance_after: number;
  reference_type: string;
  reference_no: string;
  batch_number: string;
  serial_number: string;
  notes: string;
};

export default function StockMovements() {
  const [rows, setRows] = useState<MovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    api.stockMovements().then((data) => setRows(data)).finally(() => setLoading(false));
  }, []);

  const movementTypes = useMemo(() => Array.from(new Set(rows.map((row) => row.movement_type))), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !q || [row.movement_no, row.item_name, row.warehouse, row.location, row.reference_no, row.batch_number, row.serial_number, row.notes]
        .some((value) => String(value || '').toLowerCase().includes(q));
      const matchesType = !movementType || row.movement_type === movementType;
      const matchesFrom = !fromDate || new Date(row.movement_date) >= new Date(fromDate);
      const matchesTo = !toDate || new Date(row.movement_date) <= new Date(toDate);
      return matchesSearch && matchesType && matchesFrom && matchesTo;
    });
  }, [rows, search, movementType, fromDate, toDate]);

  const columns = [
    { key: 'movement_no', header: 'رقم الحركة', width: '130px' },
    { key: 'movement_date', header: 'التاريخ', width: '120px' },
    { key: 'item_name', header: 'الصنف', width: '220px' },
    { key: 'warehouse', header: 'المستودع', width: '160px' },
    { key: 'location', header: 'الموقع', width: '220px' },
    { key: 'movement_type', header: 'نوع الحركة', width: '130px' },
    { key: 'qty_in', header: 'وارد', width: '80px' },
    { key: 'qty_out', header: 'صادر', width: '80px' },
    { key: 'balance_after', header: 'الرصيد بعد الحركة', width: '130px' },
    { key: 'reference_type', header: 'نوع المرجع', width: '120px' },
    { key: 'reference_no', header: 'رقم المرجع', width: '140px' },
    { key: 'notes', header: 'ملاحظات', width: '220px' },
  ];

  return (
    <div className="space-y-4">
      <Toolbar title="حركات المخزون">
        <button onClick={() => safePrint('حركات المخزون')} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><Printer className="w-4 h-4" />طباعة</button>
        <button onClick={() => exportCsv('حركات-المخزون', filtered as unknown as Record<string, unknown>[])} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><FileDown className="w-4 h-4" />تصدير</button>
      </Toolbar>

      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <SearchBox value={search} onChange={setSearch} placeholder="بحث برقم الحركة، الصنف، المرجع، Batch أو Serial" />
          <select value={movementType} onChange={(e) => setMovementType(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 bg-white text-sm">
            <option value="">كل أنواع الحركة</option>
            {movementTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
            <span>إلى</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div className="mr-auto text-xs text-slate-500">عدد الحركات: <span className="font-bold text-slate-700">{filtered.length}</span></div>
        </div>
        <DataGrid columns={columns} data={filtered} loading={loading} />
      </div>
    </div>
  );
}
