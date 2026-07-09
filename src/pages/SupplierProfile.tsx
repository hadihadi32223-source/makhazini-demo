import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, FileText, Printer, Truck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Toolbar from '../components/Toolbar';
import DataGrid from '../components/DataGrid';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';

type SupplierRecord = {
  id: number;
  supplier_code?: string;
  name?: string;
  companyName?: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
};

type IncomingLine = {
  item_name?: string;
  qty?: number | string;
  unit?: string;
  batch_number?: string;
  serial_number?: string;
  production_date?: string;
  expiry_date?: string;
  location?: string;
  notes?: string;
};

type IncomingDocument = {
  id: number;
  doc_number?: string;
  doc_date?: string;
  supplier?: string;
  supplier_id?: number;
  party?: string;
  warehouse?: string;
  employee?: string;
  status?: string;
  total_qty?: number | string;
  notes?: string;
  items?: IncomingLine[];
};

function value(value?: string | number | null) {
  return value === undefined || value === null || value === '' ? '—' : String(value);
}

function statusLabel(status?: string) {
  if (status === 'approved') return 'محفوظ';
  if (status === 'draft') return 'مسودة';
  if (status === 'cancelled') return 'ملغى';
  return status || '—';
}

function buildPrintableDocument(supplier: SupplierRecord, doc: IncomingDocument) {
  const rows = (doc.items || []).map((line, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${value(line.item_name)}</td>
      <td>${value(line.qty)}</td>
      <td>${value(line.unit)}</td>
      <td>${value(line.batch_number)}</td>
      <td>${value(line.serial_number)}</td>
      <td>${value(line.expiry_date)}</td>
      <td>${value(line.location)}</td>
      <td>${value(line.notes)}</td>
    </tr>`).join('');

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${value(doc.doc_number)} - مستند وارد</title>
  <style>
    body { font-family: Arial, Tahoma, sans-serif; direction: rtl; color: #111827; margin: 28px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 14px; margin-bottom: 18px; }
    h1 { margin: 0; font-size: 24px; }
    .muted { color: #6b7280; font-size: 13px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0; }
    .box { border: 1px solid #d8dce3; border-radius: 8px; padding: 10px; }
    .label { color: #6b7280; font-size: 12px; margin-bottom: 4px; }
    .value { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    th, td { border: 1px solid #d8dce3; padding: 8px; text-align: right; }
    th { background: #f5f6f8; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; }
    .sig { border-top: 1px solid #111827; padding-top: 8px; text-align: center; color: #374151; }
    @media print { button { display: none; } body { margin: 18px; } }
  </style>
</head>
<body>
  <button onclick="window.print()" style="margin-bottom: 16px; padding: 8px 14px; border: 1px solid #d8dce3; border-radius: 8px; background: #fff; cursor: pointer;">طباعة المستند</button>
  <div class="header">
    <div>
      <h1>مستند وارد</h1>
      <div class="muted">نظام إدارة المخزون والمستودعات</div>
    </div>
    <div>
      <strong>${value(doc.doc_number)}</strong><br />
      <span class="muted">${value(doc.doc_date)}</span>
    </div>
  </div>
  <div class="grid">
    <div class="box"><div class="label">المورّد</div><div class="value">${value(supplier.name)}</div></div>
    <div class="box"><div class="label">الشخص المسؤول</div><div class="value">${value(supplier.contact)}</div></div>
    <div class="box"><div class="label">الهاتف</div><div class="value">${value(supplier.phone)}</div></div>
    <div class="box"><div class="label">المستودع</div><div class="value">${value(doc.warehouse)}</div></div>
    <div class="box"><div class="label">الموظف</div><div class="value">${value(doc.employee)}</div></div>
    <div class="box"><div class="label">الحالة</div><div class="value">${statusLabel(doc.status)}</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>الصنف</th><th>الكمية</th><th>الوحدة</th><th>Batch</th><th>Serial</th><th>الانتهاء</th><th>الموقع</th><th>ملاحظات</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="9">لا توجد أصناف ضمن المستند.</td></tr>'}</tbody>
  </table>
  <div class="signatures">
    <div class="sig">أمين المستودع</div>
    <div class="sig">المورد</div>
    <div class="sig">المدير المسؤول</div>
  </div>
</body>
</html>`;
}

function printIncomingDocument(supplier: SupplierRecord, doc: IncomingDocument) {
  const popup = window.open('', '_blank', 'width=1100,height=800');
  if (!popup) {
    window.alert('يرجى السماح بالنوافذ المنبثقة لطباعة المستند.');
    return;
  }
  popup.document.open();
  popup.document.write(buildPrintableDocument(supplier, doc));
  popup.document.close();
  popup.focus();
}

export default function SupplierProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<SupplierRecord | null>(null);
  const [documents, setDocuments] = useState<IncomingDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<IncomingDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [suppliers, incomingDocs] = await Promise.all([api.suppliers(), api.incomingDocs()]);
        const current = (suppliers as SupplierRecord[]).find((row) => Number(row.id) === Number(id));
        const supplierDocs = (incomingDocs as IncomingDocument[]).filter((doc) => {
          if (!current) return false;
          return Number(doc.supplier_id) === Number(current.id) || doc.supplier === current.name || doc.party === current.name;
        });
        if (mounted) {
          setSupplier(current ?? null);
          setDocuments(supplierDocs);
          setSelectedDoc(supplierDocs[0] ?? null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, [id]);

  const totalQty = useMemo(() => documents.reduce((sum, doc) => sum + Number(doc.total_qty || 0), 0), [documents]);

  if (loading) {
    return <div className="modern-loading"><div className="modern-spinner" /><div>جاري تحميل ملف المورد...</div></div>;
  }

  if (!supplier) {
    return (
      <div className="space-y-4">
        <Toolbar title="ملف المورد">
          <button onClick={() => navigate('/suppliers')} className="modern-btn secondary"><ArrowRight className="w-4 h-4" />العودة للموردين</button>
        </Toolbar>
        <div className="bg-white border border-slate-200 rounded p-6 text-slate-600">لم يتم العثور على المورد المطلوب.</div>
      </div>
    );
  }

  const documentColumns = [
    { key: 'doc_number', header: 'رقم المستند', width: '150px' },
    { key: 'doc_date', header: 'التاريخ', width: '120px' },
    { key: 'warehouse', header: 'المستودع', width: '170px' },
    { key: 'employee', header: 'الموظف', width: '150px' },
    { key: 'total_qty', header: 'إجمالي الكميات', width: '120px' },
    { key: 'status', header: 'الحالة', width: '110px', render: (row: IncomingDocument) => <StatusBadge status={row.status || 'draft'} /> },
    {
      key: 'actions',
      header: 'إجراءات',
      width: '170px',
      render: (row: IncomingDocument) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedDoc(row)} className="modern-btn xs secondary"><FileText className="w-4 h-4" />عرض</button>
          <button onClick={() => printIncomingDocument(supplier, row)} className="modern-btn xs primary"><Printer className="w-4 h-4" />طباعة</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Toolbar title="ملف المورد">
        <button onClick={() => navigate('/suppliers')} className="modern-btn secondary"><ArrowRight className="w-4 h-4" />العودة للموردين</button>
        {selectedDoc && <button onClick={() => printIncomingDocument(supplier, selectedDoc)} className="modern-btn primary"><Printer className="w-4 h-4" />طباعة المستند المحدد</button>}
      </Toolbar>

      <div className="supplier-profile-grid">
        <aside className="supplier-info-card">
          <div className="supplier-info-header">
            <div className="supplier-info-icon"><Truck className="w-6 h-6" /></div>
            <div>
              <h3>{supplier.name}</h3>
              <p>{value(supplier.supplier_code)} · {value(supplier.companyName)}</p>
            </div>
          </div>
          <div className="supplier-info-list">
            <div><span>الشخص المسؤول</span><strong>{value(supplier.contact)}</strong></div>
            <div><span>الهاتف</span><strong>{value(supplier.phone)}</strong></div>
            <div><span>البريد</span><strong>{value(supplier.email)}</strong></div>
            <div><span>العنوان</span><strong>{value(supplier.address)}</strong></div>
            <div><span>عدد مستندات الوارد</span><strong>{documents.length}</strong></div>
            <div><span>إجمالي الكميات الواردة</span><strong>{totalQty}</strong></div>
          </div>
        </aside>

        <section className="supplier-documents-card">
          <div className="supplier-documents-header">
            <div>
              <h3>الوارد المحفوظ داخل ملف المورد</h3>
              <p className="text-sm text-slate-500 mt-1">كل مستند وارد باسم هذا المورد يظهر هنا تلقائيًا.</p>
            </div>
          </div>
          <div className="supplier-documents-body">
            <DataGrid columns={documentColumns} data={documents} emptyMessage="لا توجد مستندات وارد محفوظة لهذا المورد." />
          </div>
        </section>
      </div>

      {selectedDoc && (
        <section className="supplier-document-preview">
          <div className="supplier-preview-header">
            <div>
              <h3>معاينة مستند وارد: {selectedDoc.doc_number}</h3>
              <p className="text-sm text-slate-500 mt-1">يمكنك مراجعة المستند قبل الطباعة.</p>
            </div>
            <button onClick={() => printIncomingDocument(supplier, selectedDoc)} className="modern-btn primary"><Printer className="w-4 h-4" />طباعة</button>
          </div>
          <div className="supplier-preview-body">
            <div className="supplier-doc-summary">
              <div><span>رقم المستند</span><strong>{value(selectedDoc.doc_number)}</strong></div>
              <div><span>التاريخ</span><strong>{value(selectedDoc.doc_date)}</strong></div>
              <div><span>المستودع</span><strong>{value(selectedDoc.warehouse)}</strong></div>
              <div><span>إجمالي الكميات</span><strong>{value(selectedDoc.total_qty)}</strong></div>
            </div>
            <DataGrid
              columns={[
                { key: 'item_name', header: 'الصنف', width: '220px' },
                { key: 'qty', header: 'الكمية', width: '100px' },
                { key: 'unit', header: 'الوحدة', width: '100px' },
                { key: 'batch_number', header: 'Batch', width: '120px' },
                { key: 'serial_number', header: 'Serial', width: '120px' },
                { key: 'expiry_date', header: 'الانتهاء', width: '120px' },
                { key: 'location', header: 'الموقع', width: '220px' },
                { key: 'notes', header: 'ملاحظات', width: '160px' },
              ]}
              data={(selectedDoc.items || []).map((line, index) => ({ id: index + 1, ...line }))}
              emptyMessage="لا توجد أصناف داخل المستند."
            />
          </div>
        </section>
      )}
    </div>
  );
}
