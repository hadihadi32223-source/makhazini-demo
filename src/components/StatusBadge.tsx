type Status = 'active' | 'inactive' | 'pending' | 'approved' | 'draft' | 'warning' | 'danger' | 'success' | string;

const styles: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const labels: Record<string, string> = {
  active: 'مفعّل',
  inactive: 'معطّل',
  pending: 'معلّق',
  approved: 'محفوظ',
  draft: 'مسودة',
};

interface Props {
  status: Status;
  label?: string;
}

export default function StatusBadge({ status, label }: Props) {
  const cls = styles[status] || styles.inactive;
  const text = label || labels[status] || status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {text}
    </span>
  );
}
