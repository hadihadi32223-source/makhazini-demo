import { useEffect, useMemo, useState } from 'react';
import { BarChart3, FileText, Package, Warehouse, ArrowDownLeft, ArrowUpRight, Download, Eye, Printer } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import DataGrid from '../components/DataGrid';
import { api } from '../lib/api';
import { exportCsv, showToast } from '../lib/uiActions';
import { printCompanyDocument } from '../lib/companyPrint';

type ReportKey =
  | 'currentStock'
  | 'itemMovement'
  | 'warehouseMovement'
  | 'incoming'
  | 'outgoing'
  | 'inventoryCounts'
  | 'lowStock'
  | 'overMax'
  | 'expired'
  | 'nearExpiry'
  | 'deadStock'
  | 'mostMoving'
  | 'suppliers'
  | 'recipients'
  | 'activity';

type ReportCard = {
  key: ReportKey;
  title: string;
  icon: typeof BarChart3;
  desc: string;
};

const reportCards: ReportCard[] = [
  { key: 'currentStock', title: 'تقرير المخزون الحالي', icon: Warehouse, desc: 'يعرض الكميات الحالية حسب الصنف والمستودع والموقع' },
  { key: 'itemMovement', title: 'تقرير حركة صنف', icon: FileText, desc: 'سجل كامل لكل حركات صنف محدد مع الرصيد بعد الحركة' },
  { key: 'warehouseMovement', title: 'تقرير حركة مستودع', icon: Warehouse, desc: 'كل الوارد والصادر داخل مستودع معين' },
  { key: 'incoming', title: 'تقرير الوارد', icon: ArrowDownLeft, desc: 'مستندات الوارد حسب المورد والمستودع والتاريخ' },
  { key: 'outgoing', title: 'تقرير الصادر', icon: ArrowUpRight, desc: 'مستندات الصادر حسب الجهة المستلمة والمستودع والتاريخ' },
  { key: 'inventoryCounts', title: 'تقرير الجرد والفروقات', icon: BarChart3, desc: 'الكمية النظامية مقابل الفعلية وسبب الفرق' },
  { key: 'lowStock', title: 'تقرير الأصناف تحت الحد الأدنى', icon: Package, desc: 'الأصناف التي تحتاج اقتراح إعادة توريد' },
  { key: 'overMax', title: 'تقرير الأصناف فوق الحد الأعلى', icon: Package, desc: 'الأصناف التي تجاوزت الحد التشغيلي الأعلى' },
  { key: 'expired', title: 'تقرير الأصناف المنتهية الصلاحية', icon: Package, desc: 'الأصناف والباتشات التي انتهت صلاحيتها' },
  { key: 'nearExpiry', title: 'تقرير الأصناف قريبة الانتهاء', icon: Package, desc: 'أصناف يجب صرفها أو عزلها حسب FEFO' },
  { key: 'deadStock', title: 'تقرير الأصناف الراكدة', icon: Package, desc: 'أصناف بلا حركة خلال فترة محددة' },
  { key: 'mostMoving', title: 'تقرير الأصناف الأكثر حركة', icon: BarChart3, desc: 'ترتيب الأصناف حسب عدد الحركات والكميات' },
  { key: 'suppliers', title: 'تقرير الموردين', icon: FileText, desc: 'حركة كل مورد في مستندات الوارد' },
  { key: 'recipients', title: 'تقرير الجهات المستلمة', icon: FileText, desc: 'حركة كل جهة في مستندات الصادر' },
  { key: 'activity', title: 'تقرير سجل النشاط', icon: FileText, desc: 'تدقيق المستخدمين والعمليات والتعديلات' },
];

const headerMap: Record<string, string> = {
  id: '#',
  item_name: 'الصنف',
  name: 'الاسم',
  warehouse: 'المستودع',
  location: 'الموقع',
  batch_number: 'Batch',
  serial_number: 'Serial',
  expiry_date: 'تاريخ الانتهاء',
  qty_available: 'المتاح',
  qty_reserved: 'المحجوز',
  qty_in_transit: 'قيد النقل',
  qty_damaged: 'التالف',
  last_movement_at: 'آخر حركة',
  status: 'الحالة',
  movement_no: 'رقم الحركة',
  movement_date: 'تاريخ الحركة',
  movement_type: 'نوع الحركة',
  qty_in: 'وارد',
  qty_out: 'صادر',
  balance_after: 'الرصيد بعد الحركة',
  reference_type: 'نوع المرجع',
  reference_no: 'رقم المرجع',
  notes: 'ملاحظات',
  doc_number: 'رقم المستند',
  doc_date: 'التاريخ',
  supplier: 'المورد',
  recipient: 'الجهة المستلمة',
  from_warehouse: 'من مستودع',
  to_warehouse: 'إلى مستودع',
  total_qty: 'إجمالي الكمية',
  count_no: 'رقم الجرد',
  count_date: 'تاريخ الجرد',
  total_difference: 'إجمالي الفرق',
  min_qty: 'الحد الأدنى',
  max_qty: 'الحد الأعلى',
  current_qty: 'الكمية الحالية',
  shortage_qty: 'النقص',
  suggested_qty: 'اقتراح إعادة توريد',
  company_name: 'الشركة',
  phone: 'الهاتف',
  email: 'البريد',
  action: 'العملية',
  entity: 'الشاشة',
  entity_id: 'المرجع',
  details: 'التفاصيل',
  user_name: 'المستخدم',
  created_at: 'وقت الإنشاء',
};

const hiddenReportKeys = new Set(['code', 'sku', 'barcode', 'brand', 'manufacturer', 'country', 'contact']);

function normalizeRows(rows: any[]) {
  return rows.map((row, index) => ({ id: row.id ?? index + 1, ...row }));
}

function cleanReportRows(rows: any[]) {
  return rows.map((row) => Object.fromEntries(
    Object.entries(row).filter(([key, value]) => !hiddenReportKeys.has(key) && typeof value !== 'object'),
  ));
}

export default function Reports() {
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportCard | null>(null);
  const [reportRows, setReportRows] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    Promise.all([api.items(), api.warehouses()]).then(([i, w]) => { setItems(i); setWarehouses(w); });
  }, []);

  const buildReport = async (report: ReportCard) => {
    setLoadingReport(true);
    try {
      const now = Date.now();
      let rows: any[] = [];
      if (report.key === 'currentStock') rows = await api.currentStock();
      if (report.key === 'itemMovement' || report.key === 'warehouseMovement' || report.key === 'mostMoving' || report.key === 'deadStock') rows = await api.stockMovements();
      if (report.key === 'incoming') rows = await api.incomingDocs();
      if (report.key === 'outgoing') rows = await api.outgoingDocs();
      if (report.key === 'inventoryCounts') rows = await api.inventoryCounts();
      if (report.key === 'suppliers') rows = await api.suppliers();
      if (report.key === 'recipients') rows = await api.recipients();
      if (report.key === 'activity') rows = await api.activityLog();
      if (report.key === 'lowStock') {
        rows = items
          .filter((item: any) => Number(item.current_qty || 0) <= Number(item.min_qty || 0))
          .map((item: any) => ({ ...item, shortage_qty: Math.max(Number(item.min_qty || 0) - Number(item.current_qty || 0), 0), suggested_qty: Math.max(Number(item.max_qty || 0) - Number(item.current_qty || 0), 0) }));
      }
      if (report.key === 'overMax') rows = items.filter((item: any) => Number(item.max_qty || 0) > 0 && Number(item.current_qty || 0) > Number(item.max_qty || 0));
      if (report.key === 'expired' || report.key === 'nearExpiry') {
        const stock = await api.currentStock();
        rows = stock.filter((row: any) => {
          if (!row.expiry_date) return false;
          const date = new Date(row.expiry_date).getTime();
          return report.key === 'expired' ? date < now : date >= now && date <= now + 30 * 86400000;
        });
      }

      if (selectedWarehouse) {
        rows = rows.filter((row: any) => [row.warehouse, row.from_warehouse, row.to_warehouse].some((value) => String(value || '') === selectedWarehouse));
      }
      if (selectedItem) {
        rows = rows.filter((row: any) => [row.item_name, row.name].some((value) => String(value || '') === selectedItem));
      }

      setSelectedReport(report);
      setReportRows(normalizeRows(rows));
      showToast(`تم فتح ${report.title} للمعاينة. يمكنك الآن طباعته من زر الطباعة.`);
    } finally {
      setLoadingReport(false);
    }
  };

  const columns = useMemo(() => {
    if (!reportRows.length) return [];
    const preferredKeys = Object.keys(headerMap).filter((key) => key in reportRows[0] && !hiddenReportKeys.has(key));
    const extraKeys = Object.keys(reportRows[0]).filter((key) => !(key in headerMap) && !hiddenReportKeys.has(key) && typeof reportRows[0][key] !== 'object');
    return [...preferredKeys, ...extraKeys].slice(0, 12).map((key) => ({ key, header: headerMap[key] ?? key, width: key === 'details' ? '280px' : '140px' }));
  }, [reportRows]);

  const printSelectedReport = () => {
    if (!selectedReport) {
      showToast('اختر تقريرًا أولًا.');
      return;
    }
    if (!reportRows.length) {
      showToast('لا توجد بيانات في التقرير المختار للطباعة.');
      return;
    }

    printCompanyDocument({
      title: selectedReport.title,
      documentLabel: 'تقرير رسمي مختار للمعاينة والطباعة فقط',
      meta: [
        { label: 'نوع التقرير', value: selectedReport.title },
        { label: 'المستودع', value: selectedWarehouse || 'جميع المستودعات' },
        { label: 'الصنف', value: selectedItem || 'جميع الأصناف' },
        { label: 'عدد السجلات', value: reportRows.length },
      ],
      columns: columns.map((column) => ({ key: column.key, header: column.header })),
      rows: reportRows as Record<string, unknown>[],
      summary: [
        { label: 'إجمالي السجلات المطبوعة', value: reportRows.length },
      ],
    });
  };

  return (
    <div className="space-y-4">
      <Toolbar title="التقارير">
        <div className="flex items-center gap-2 flex-wrap">
          <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-sm bg-white">
            <option value="">جميع المستودعات</option>
            {warehouses.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}
          </select>
          <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-sm bg-white">
            <option value="">جميع الأصناف</option>
            {items.map((i) => <option key={i.id} value={i.name}>{i.name}</option>)}
          </select>
          <button onClick={() => selectedReport ? void buildReport(selectedReport) : showToast('اختر تقريرًا أولًا.')} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded"><Eye className="w-4 h-4" />عرض التقرير</button>
          <button onClick={printSelectedReport} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><Printer className="w-4 h-4" />طباعة</button>
          <button onClick={() => exportCsv(selectedReport?.title ?? 'التقارير', reportRows.length ? cleanReportRows(reportRows) : reportCards.map((r) => ({ title: r.title, description: r.desc })))} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><Download className="w-4 h-4" />تصدير</button>
        </div>
      </Toolbar>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {reportCards.map((r) => {
          const Icon = r.icon;
          const active = selectedReport?.key === r.key;
          return (
            <button key={r.key} type="button" onClick={() => void buildReport(r)} className={`text-right bg-white border rounded shadow-sm p-3 hover:border-teal-300 transition-colors ${active ? 'border-blue-600 ring-1 ring-blue-500' : 'border-slate-200'}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded bg-slate-50 text-teal-700 flex items-center justify-center border border-slate-100">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{r.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm report-preview-panel">
        <div className="report-preview-header px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h3 className="font-bold text-slate-800">{selectedReport ? selectedReport.title : 'معاينة التقرير'}</h3>
            <p className="text-xs text-slate-500 mt-1">{selectedReport ? `عدد السجلات: ${reportRows.length}` : 'اختر تقريرًا من الأعلى لفتحه داخل الشاشة، ولن تتم الطباعة إلا عند الضغط على زر طباعة.'}</p>
          </div>
          {selectedReport && (
            <div className="flex gap-2">
              <button onClick={printSelectedReport} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><Printer className="w-4 h-4" />طباعة التقرير</button>
              <button onClick={() => exportCsv(selectedReport.title, cleanReportRows(reportRows))} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><Download className="w-4 h-4" />تصدير CSV</button>
            </div>
          )}
        </div>
        {selectedReport ? (
          <DataGrid columns={columns} data={reportRows} loading={loadingReport} emptyMessage="لا توجد بيانات لهذا التقرير حسب الفلاتر المختارة" />
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-400 flex-col gap-2">
            <BarChart3 className="w-12 h-12" />
            <p className="text-sm">اختر تقريرًا لعرضه هنا أولًا، ثم اطبعه عند الحاجة</p>
          </div>
        )}
      </div>
    </div>
  );
}
