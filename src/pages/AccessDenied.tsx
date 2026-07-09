import { ShieldAlert } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import { useAuth } from '../auth/AuthContext';

export default function AccessDenied() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <Toolbar title="غير مصرح" />
      <div className="bg-white border border-red-200 p-6 shadow-sm flex items-start gap-4">
        <ShieldAlert className="w-10 h-10 text-red-600" />
        <div>
          <h2 className="text-xl font-bold text-red-700 mb-2">لا تملك صلاحية الوصول إلى هذه الشاشة</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            المستخدم الحالي: <strong>{user?.full_name}</strong> — الدور: <strong>{user?.role_name}</strong>.
            يرجى التواصل مع مدير النظام لتعديل الصلاحيات عند الحاجة.
          </p>
        </div>
      </div>
    </div>
  );
}
