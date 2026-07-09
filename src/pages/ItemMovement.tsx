import { useEffect, useMemo, useState } from 'react';
import { Search, Calendar, Package } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import SearchBox from '../components/SearchBox';
import DataGrid from '../components/DataGrid';
import { api } from '../lib/api';

interface Movement {
  id: number | string;
  doc_number: string;
  doc_date: string;
  type: string;
  warehouse: string;
  party: string;
  qty: number;
  unit: string;
  location: string;
  status: string;
  item_name: string;
}

export default function ItemMovement() {
  const [items, setItems] = useState<any[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    Promise.all([api.items(), api.incomingDocs(), api.outgoingDocs(), api.transfers()]).then(([itemsData, incoming, outgoing, transfers]) => {
      setItems(itemsData);
      const all: Movement[] = [
        ...incoming.flatMap((d: any) => (d.items || []).map((it: any, idx: number) => ({
          id: `in-${d.id}-${idx}`,
          doc_number: d.doc_number,
          doc_date: d.doc_date,
          type: 'وارد',
          warehouse: d.warehouse,
          party: d.supplier,
          qty: it.qty,
          unit: it.unit,
          location: it.location,
          status: d.status,
          item_name: it.item_name,
        }))),
        ...outgoing.flatMap((d: any) => (d.items || []).map((it: any, idx: number) => ({
          id: `out-${d.id}-${idx}`,
          doc_number: d.doc_number,
          doc_date: d.doc_date,
          type: 'صادر',
          warehouse: d.warehouse,
          party: d.recipient,
          qty: it.qty,
          unit: it.unit,
          location: it.location,
          status: d.status,
          item_name: it.item_name,
        }))),
        ...transfers.flatMap((d: any) => (d.items || []).map((it: any, idx: number) => ({
          id: `tr-${d.id}-${idx}`,
          doc_number: d.doc_number,
          doc_date: d.doc_date,
          type: 'تحويل',
          warehouse: `${d.from_warehouse} ← ${d.to_warehouse}`,
          party: d.employee,
          qty: it.qty,
          unit: it.unit,
          location: `${it.from_location} ← ${it.to_location}`,
          status: d.status,
          item_name: it.item_name,
        }))),
      ];
      setMovements(all.sort((a, b) => new Date(b.doc_date).getTime() - new Date(a.doc_date).getTime()));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return movements.filter((m) => {
      const matchesItem = !selectedItem || m.item_name === selectedItem;
      const matchesSearch = !q || m.doc_number.toLowerCase().includes(q) || m.party.toLowerCase().includes(q);
      const matchesFrom = !fromDate || new Date(m.doc_date) >= new Date(fromDate);
      const matchesTo = !toDate || new Date(m.doc_date) <= new Date(toDate);
      return matchesItem && matchesSearch && matchesFrom && matchesTo;
    });
  }, [movements, selectedItem, search, fromDate, toDate]);

  const columns = [
    { key: 'doc_number', header: 'رقم المستند', width: '140px' },
    { key: 'doc_date', header: 'التاريخ', width: '120px' },
    { key: 'type', header: 'النوع', width: '90px' },
    { key: 'item_name', header: 'الصنف', width: '200px' },
    { key: 'party', header: 'الطرف', width: '180px' },
    { key: 'warehouse', header: 'المستودع', width: '160px' },
    { key: 'location', header: 'الموقع', width: '180px' },
    { key: 'qty', header: 'الكمية', width: '90px' },
    { key: 'unit', header: 'الوحدة', width: '80px' },
    { key: 'status', header: 'الحالة', width: '100px' },
  ];

  return (
    <div className="space-y-4">
      <Toolbar title="حركة صنف">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Package className="w-4 h-4" />
          <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 bg-white min-w-[200px]">
            <option value="">جميع الأصناف</option>
            {items.map((i) => <option key={i.id} value={i.name}>{i.name}</option>)}
          </select>
        </div>
      </Toolbar>

      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <SearchBox value={search} onChange={setSearch} placeholder="بحث برقم المستند أو الطرف" />
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">من</span>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
            <span className="text-xs">إلى</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div className="mr-auto text-xs text-slate-500">عدد الحركات: <span className="font-bold text-slate-700">{filtered.length}</span></div>
        </div>
        <DataGrid columns={columns} data={filtered} loading={loading} />
      </div>
    </div>
  );
}
