import { useEffect, useState } from 'react';
import { DatabaseBackup, FolderOpen, RotateCcw, ShieldCheck } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import DataGrid from '../components/DataGrid';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';
import { showToast } from '../lib/uiActions';

type BackupRow = { id: number; backup_date: string; backup_path: string; created_by: string; status: string; notes: string };

export default function BackupRestore() {
  const [rows, setRows] = useState<BackupRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.backups().then((data) => setRows(data)).finally(() => setLoading(false));
  useEffect(() => { void load(); }, []);

  const createBackup = async () => {
    await api.createBackup({ backup_date: new Date().toISOString(), backup_path: 'C:/powered by nexora/Backups/manual-backup.db', created_by: 'مدير النظام', status: 'success', notes: 'نسخة من الواجهة' });
    await load();
    alert('تم إنشاء سجل نسخة احتياطية تجريبيًا.');
  };

  const columns = [
    { key: 'backup_date', header: 'التاريخ', width: '180px', render: (row: BackupRow) => new Date(row.backup_date).toLocaleString('ar-SA') },
    { key: 'backup_path', header: 'المسار', width: '360px' },
    { key: 'created_by', header: 'المستخدم', width: '150px' },
    { key: 'status', header: 'الحالة', width: '100px', render: (row: BackupRow) => <StatusBadge status={row.status} label={row.status === 'success' ? 'ناجحة' : row.status} /> },
    { key: 'notes', header: 'ملاحظات', width: '220px' },
  ];

  return (
    <div className="space-y-4">
      <Toolbar title="النسخ الاحتياطي والاستعادة">
        <button onClick={createBackup} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded"><DatabaseBackup className="w-4 h-4" />إنشاء نسخة احتياطية</button>
        <button onClick={() => { if (confirm('استعادة نسخة احتياطية قد تستبدل البيانات الحالية. هل أنت متأكد؟')) showToast('تم تنفيذ طلب الاستعادة التجريبي.'); }} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><RotateCcw className="w-4 h-4" />استعادة نسخة</button>
        <button onClick={() => showToast('مسار النسخ الاحتياطي: C:/powered by nexora/Backups')} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><FolderOpen className="w-4 h-4" />فتح المجلد</button>
      </Toolbar>
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-teal-600 mt-0.5" />
        <p className="text-sm text-slate-600 leading-relaxed">يجب تسجيل أي عملية Backup أو Restore في سجل النشاط. الاستعادة تحتاج صلاحية Backup.Manage وتأكيد واضح من المستخدم.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <DataGrid columns={columns} data={rows} loading={loading} />
      </div>
    </div>
  );
}
