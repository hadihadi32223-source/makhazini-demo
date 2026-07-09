import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ClipboardCheck,
  Package,
  Warehouse,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import AlertCard from '../components/AlertCard';
import DataGrid from '../components/DataGrid';
import { api } from '../lib/api';

interface Stats {
  totalItems: number;
  totalWarehouses: number;
  totalAvailableQty: number;
  lowStock: number;
  expiredOrNear: number;
  incomingToday: number;
  outgoingToday: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ totalItems: 0, totalWarehouses: 0, totalAvailableQty: 0, lowStock: 0, expiredOrNear: 0, incomingToday: 0, outgoingToday: 0 });
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [latestIncoming, setLatestIncoming] = useState<any[]>([]);
  const [latestOutgoing, setLatestOutgoing] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [items, warehouses, currentStock, movements, incoming, outgoing] = await Promise.all([
          api.items(),
          api.warehouses(),
          api.currentStock(),
          api.stockMovements(),
          api.incomingDocs(),
          api.outgoingDocs(),
        ]);

        const today = new Date().toISOString().slice(0, 10);
        const nearExpiry = currentStock.filter((row: any) => row.expiry_date && new Date(row.expiry_date).getTime() <= Date.now() + 30 * 86400000);
        const lowStockItems = items.filter((item: any) => Number(item.current_qty || 0) <= Number(item.min_qty || 0));

        setStats({
          totalItems: items.length,
          totalWarehouses: warehouses.length,
          totalAvailableQty: currentStock.reduce((sum: number, row: any) => sum + Number(row.qty_available || 0), 0),
          lowStock: lowStockItems.length,
          expiredOrNear: nearExpiry.length,
          incomingToday: incoming.filter((doc: any) => String(doc.doc_date).startsWith(today)).length,
          outgoingToday: outgoing.filter((doc: any) => String(doc.doc_date).startsWith(today)).length,
        });

        setAlerts(lowStockItems.slice(0, 6).map((item: any) => ({
          id: item.id,
          title: item.name,
          subtitle: `الكمية الحالية: ${item.current_qty} – الحد الأدنى: ${item.min_qty}`,
          type: 'low',
        })));

        setExpiryAlerts(nearExpiry.slice(0, 6).map((row: any) => ({
          id: row.id,
          title: row.item_name,
          subtitle: `Batch: ${row.batch_number || '-'} – انتهاء: ${row.expiry_date}`,
          type: 'expiry',
        })));

        setRecentMovements(movements.slice(0, 8));
        setLatestIncoming(incoming.slice(0, 5));
        setLatestOutgoing(outgoing.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const movementColumns = [
    { key: 'movement_date', header: 'التاريخ', width: '110px' },
    { key: 'item_name', header: 'الصنف', width: '180px' },
    { key: 'warehouse', header: 'المستودع', width: '140px' },
    { key: 'location', header: 'الموقع', width: '180px' },
    { key: 'movement_type', header: 'نوع الحركة', width: '120px' },
    { key: 'qty_in', header: 'وارد', width: '70px' },
    { key: 'qty_out', header: 'صادر', width: '70px' },
    { key: 'reference_no', header: 'المرجع', width: '130px' },
  ];

  const incomingColumns = [
    { key: 'doc_number', header: 'رقم المستند', width: '140px' },
    { key: 'doc_date', header: 'التاريخ', width: '120px' },
    { key: 'supplier', header: 'المورّد', width: '180px' },
    { key: 'warehouse', header: 'المستودع', width: '160px' },
    { key: 'status', header: 'الحالة', width: '100px' },
  ];

  const outgoingColumns = [
    { key: 'doc_number', header: 'رقم المستند', width: '140px' },
    { key: 'doc_date', header: 'التاريخ', width: '120px' },
    { key: 'recipient', header: 'الجهة المستلمة', width: '180px' },
    { key: 'warehouse', header: 'المستودع', width: '160px' },
    { key: 'status', header: 'الحالة', width: '100px' },
  ];

  const operationalNote = useMemo(() => {
    if (stats.lowStock > 0) return 'يوجد أصناف تحت الحد الأدنى. راجع اقتراحات إعادة التوريد قبل إنشاء أي صادر جديد.';
    if (stats.expiredOrNear > 0) return 'يوجد أصناف قريبة من الانتهاء. استخدم FIFO/FEFO عند الصرف.';
    return 'المخزون مستقر حاليًا. حافظ على الجرد الدوري وسجل الحركة لكل عملية.';
  }, [stats.lowStock, stats.expiredOrNear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="عدد الأصناف" value={stats.totalItems} icon={<Package className="w-6 h-6" />} color="teal" onClick={() => navigate('/items')} />
        <StatCard title="عدد المستودعات" value={stats.totalWarehouses} icon={<Warehouse className="w-6 h-6" />} color="blue" onClick={() => navigate('/warehouses')} />
        <StatCard title="إجمالي الكميات المتاحة" value={stats.totalAvailableQty} icon={<ClipboardCheck className="w-6 h-6" />} color="teal" onClick={() => navigate('/stock')} />
        <StatCard title="أصناف تحت الحد الأدنى" value={stats.lowStock} icon={<AlertTriangle className="w-6 h-6" />} color="amber" onClick={() => navigate('/low-stock')} />
        <StatCard title="أصناف قريبة/منتهية" value={stats.expiredOrNear} icon={<Bell className="w-6 h-6" />} color="red" onClick={() => navigate('/stock')} />
        <StatCard title="مستندات وارد اليوم" value={stats.incomingToday} icon={<ArrowDownLeft className="w-6 h-6" />} color="teal" onClick={() => navigate('/incoming')} />
        <StatCard title="مستندات صادر اليوم" value={stats.outgoingToday} icon={<ArrowUpRight className="w-6 h-6" />} color="blue" onClick={() => navigate('/outgoing')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-teal-600" />
              <h3 className="font-semibold text-slate-800">آخر حركات المخزون</h3>
              <span className="mr-auto text-xs text-slate-500">قراءة فقط — لا تعديل مباشر للكمية</span>
            </div>
            <DataGrid columns={movementColumns} data={recentMovements} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-slate-800">أحدث مستندات الوارد</h3>
              </div>
              <DataGrid columns={incomingColumns} data={latestIncoming} />
            </div>
            <div className="bg-white border border-slate-200 rounded shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-red-600" />
                <h3 className="font-semibold text-slate-800">أحدث مستندات الصادر</h3>
              </div>
              <DataGrid columns={outgoingColumns} data={latestOutgoing} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <AlertCard title="تنبيهات المخزون" alerts={alerts} variant="warning" />
          <AlertCard title="تنبيهات الانتهاء" alerts={expiryAlerts} variant="danger" />
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-teal-400" />
              <h3 className="font-semibold">نصيحة تشغيلية</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{operationalNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
