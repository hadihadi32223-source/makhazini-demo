import { useEffect, useMemo, useState } from 'react';
import { Search, Calendar, User } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import SearchBox from '../components/SearchBox';
import DataGrid from '../components/DataGrid';
import { api } from '../lib/api';

interface Log {
  id: number;
  created_at: string;
  user_name: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');

  useEffect(() => {
    api.activityLog().then((data) => { setLogs(data); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      const matchesSearch = !q ||
        l.user_name.toLowerCase().includes(q) ||
        l.entity.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q);
      const matchesAction = !actionFilter || l.action === actionFilter;
      const matchesDate = !fromDate || new Date(l.created_at) >= new Date(fromDate);
      return matchesSearch && matchesAction && matchesDate;
    });
  }, [logs, search, actionFilter, fromDate]);

  const columns = [
    { key: 'created_at', header: 'التاريخ والوقت', width: '150px', render: (row: Log) => new Date(row.created_at).toLocaleString('ar-SA') },
    { key: 'user_name', header: 'المستخدم', width: '140px' },
    { key: 'action', header: 'العملية', width: '120px' },
    { key: 'entity', header: 'الكيان', width: '140px' },
    { key: 'entity_id', header: 'رقم الكيان', width: '120px' },
    { key: 'details', header: 'التفاصيل', width: 'auto' },
  ];

  return (
    <div className="space-y-4">
      <Toolbar title="سجل النشاط">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <User className="w-4 h-4" />
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 bg-white">
            <option value="">جميع العمليات</option>
            <option value="إنشاء">إنشاء</option>
            <option value="تعديل">تعديل</option>
            <option value="تعطيل">تعطيل</option>
            <option value="حفظ">حفظ</option>
          </select>
        </div>
      </Toolbar>

      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <SearchBox value={search} onChange={setSearch} placeholder="بحث بالمستخدم أو التفاصيل" />
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">من تاريخ</span>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div className="mr-auto text-xs text-slate-500">عدد السجلات: <span className="font-bold text-slate-700">{filtered.length}</span></div>
        </div>
        <DataGrid columns={columns} data={filtered} loading={loading} />
      </div>
    </div>
  );
}
