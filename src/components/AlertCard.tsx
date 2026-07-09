import { AlertTriangle, Bell } from 'lucide-react';

interface Alert {
  id: number;
  title: string;
  subtitle: string;
  type: 'low' | 'expiry' | 'over';
}

interface Props {
  title: string;
  alerts: Alert[];
  variant?: 'warning' | 'danger';
}

export default function AlertCard({ title, alerts, variant = 'warning' }: Props) {
  const Icon = variant === 'danger' ? AlertTriangle : Bell;
  const color = variant === 'danger' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50';

  return (
    <div className="bg-white border border-slate-200 rounded shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <Icon className={`w-4 h-4 p-0.5 rounded ${color}`} />
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <span className="mr-auto text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
          {alerts.length}
        </span>
      </div>
      <ul className="divide-y divide-slate-100 max-h-64 overflow-auto">
        {alerts.length === 0 ? (
          <li className="px-4 py-4 text-center text-slate-500 text-sm">لا توجد تنبيهات</li>
        ) : (
          alerts.map((a) => (
            <li key={a.id} className="px-4 py-3 hover:bg-slate-50">
              <div className="text-sm font-medium text-slate-800">{a.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">{a.subtitle}</div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
