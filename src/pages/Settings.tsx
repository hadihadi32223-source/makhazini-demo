import { useEffect, useState } from 'react';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import DataGrid from '../components/DataGrid';
import { api } from '../lib/api';
import { showToast } from '../lib/uiActions';

type SettingRow = { id: number; key: string; name: string; value: string; group: string };

export default function Settings() {
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.settings().then((data) => setRows(data)).finally(() => setLoading(false)); }, []);

  const columns = [
    { key: 'group', header: 'المجموعة', width: '160px' },
    { key: 'name', header: 'الإعداد', width: '260px' },
    { key: 'value', header: 'القيمة', width: '260px', render: (row: SettingRow) => <input defaultValue={row.value} className="w-full border border-slate-300 rounded px-2 py-1 text-sm" /> },
    { key: 'key', header: 'المفتاح التقني', width: '180px' },
  ];

  return (
    <div className="space-y-4">
      <Toolbar title="الإعدادات">
        <button onClick={() => showToast('تم حفظ الإعدادات محليًا.')} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded"><Save className="w-4 h-4" />حفظ</button>
      </Toolbar>
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex items-start gap-3">
        <SettingsIcon className="w-6 h-6 text-teal-600 mt-0.5" />
        <p className="text-sm text-slate-600 leading-relaxed">الإعدادات لا تحتوي على أي حقول مالية. يتم ضبط اسم الشركة، مسار النسخ الاحتياطي، أيام تنبيه الانتهاء، وقواعد المخزون التشغيلية فقط.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <DataGrid columns={columns} data={rows} loading={loading} />
      </div>
    </div>
  );
}
