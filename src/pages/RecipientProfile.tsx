import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, FileText, Printer, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Toolbar from '../components/Toolbar';
import DataGrid from '../components/DataGrid';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';

type RecipientRecord = {
  id: number;
  recipient_code?: string;
  name?: string;
  type?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
};

type OutgoingLine = {
  item_name?: string;
  qty?: number | string;
  unit?: string;
  batch_number?: string;
  serial_number?: string;
  expiry_date?: string;
  location?: string;
  notes?: string;
};

type OutgoingDocument = {
  id: number;
  doc_number?: string;
  doc_date?: string;
  recipient?: string;
  recipient_id?: number;
  party?: string;
  warehouse?: string;
  employee?: string;
  status?: string;
  total_qty?: number | string;
  notes?: string;
  items?: OutgoingLine[];
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

function buildPrintableDocument(recipient: RecipientRecord, doc: OutgoingDocument) {
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
  <title>${value(doc.doc_number)} - مستند صادر</title>
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
    .signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 40px; }
    .sig { border-top: 1px solid #111827; padding-top: 8px; text-align: center; color: #374151; }
    @media print { button { display: none; } body { margin: 18px; } }
  </style>
</head>
<body>
  <button onclick="window.print()" style="margin-bottom: 16px; padding: 8px 14px; border: 1px solid #d8dce3; border-radius: 8px; background: #fff; cursor: pointer;">طباعة المستند</button>
  <div class="header">
    <div>
      <h1>مستند صادر</h1>
      <div class="muted">نظام إدارة المخزون والمستودعات</div>
    </div>
    <div>
      <strong>${value(doc.doc_number)}</strong><br />
      <span class="muted">${value(doc.doc_date)}</span>
    </div>
  </div>
  <div class="grid">
    <div class="box"><div class="label">العميل</div><div class="value">${value(recipient.name)}</div></div>
    <div class="box"><div class="label">الهاتف</div><div class="value">${value(recipient.phone)}</div></div>
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
    <div class="sig">العميل / المستلم</div>
  </div>
</body>
</html>`;
}

function printOutgoingDocument(recipient: RecipientRecord, doc: OutgoingDocument) {
  const popup = window.open('', '_blank', 'width=1100,height=800');
  if (!popup) {
    window.alert('يرجى السماح بالنوافذ المنبثقة لطباعة المستند.');
    return;
  }
  popup.document.open();
  popup.document.write(buildPrintableDocument(recipient, doc));
  popup.document.close();
  popup.focus();
}

export default function RecipientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState<RecipientRecord | null>(null);
  const [documents, setDocuments] = useState<OutgoingDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<OutgoingDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [recipients, outgoingDocs] = await Promise.all([api.recipients(), api.outgoingDocs()]);
        const current = (recipients as RecipientRecord[]).find((row) => Number(row.id) === Number(id));
        const recipientDocs = (outgoingDocs as OutgoingDocument[]).filter((doc) => {
          if (!current) return false;
          return Number(doc.recipient_id) === Number(current.id) || doc.recipient === current.name || doc.party === current.name;
        });
        if (mounted) {
          setRecipient(current ?? null);
          setDocuments(recipientDocs);
          setSelectedDoc(recipientDocs[0] ?? null);
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
    return <div className="modern-loading"><div className="modern-spinner" /><div>جاري تحميل ملف العميل...</div></div>;
  }

  if (!recipient) {
    return (
      <div className="space-y-4">
        <Toolbar title="ملف العميل">
          <button onClick={() => navigate('/recipients')} className="modern-btn secondary"><ArrowRight className="w-4 h-4" />العودة للعملاء</button>
        </Toolbar>
        <div className="bg-white border border-slate-200 rounded p-6 text-slate-600">لم يتم العثور على العميل المطلوب.</div>
      </div>
    );
  }

  const documentColumns = [
    { key: 'doc_number', header: 'رقم المستند', width: '150px' },
    { key: 'doc_date', header: 'التاريخ', width: '120px' },
    { key: 'warehouse', header: 'المستودع', width: '170px' },
    { key: 'employee', header: 'الموظف', width: '150px' },
    { key: 'total_qty', header: 'إجمالي الكميات', width: '120px' },
    { key: 'status', header: 'الحالة', width: '110px', render: (row: OutgoingDocument) => <StatusBadge status={row.status || 'draft'} /> },
    {
      key: 'actions',
      header: 'إجراءات',
      width: '170px',
      render: (row: OutgoingDocument) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedDoc(row)} className="modern-btn xs secondary"><FileText className="w-4 h-4" />عرض</button>
          <button onClick={() => printOutgoingDocument(recipient, row)} className="modern-btn xs primary"><Printer className="w-4 h-4" />طباعة</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Toolbar title="ملف العميل">
        <button onClick={() => navigate('/recipients')} className="modern-btn secondary"><ArrowRight className="w-4 h-4" />العودة للعملاء</button>
        {selectedDoc && <button onClick={() => printOutgoingDocument(recipient, selectedDoc)} className="modern-btn primary"><Printer className="w-4 h-4" />طباعة المستند المحدد</button>}
      </Toolbar>

      <div className="supplier-profile-grid">
        <aside className="supplier-info-card">
          <div className="supplier-info-header">
            <div className="supplier-info-icon"><Users className="w-6 h-6" /></div>
            <div>
              <h3>{recipient.name}</h3>
              <p>{value(recipient.recipient_code)} · {value(recipient.type)}</p>
            </div>
          </div>
          <div className="supplier-info-list">
            <div><span>الهاتف</span><strong>{value(recipient.phone)}</strong></div>
            <div><span>البريد</span><strong>{value(recipient.email)}</strong></div>
            <div><span>العنوان</span><strong>{value(recipient.address)}</strong></div>
            <div><span>عدد مستندات الصادر</span><strong>{documents.length}</strong></div>
            <div><span>إجمالي الكميات الصادرة</span><strong>{totalQty}</strong></div>
          </div>
        </aside>

        <section className="supplier-documents-card">
          <div className="supplier-documents-header">
            <div>
              <h3>الصادر المحفوظ داخل ملف العميل</h3>
              <p className="text-sm text-slate-500 mt-1">كل مستند صادر باسم هذا العميل يظهر هنا تلقائيًا.</p>
            </div>
          </div>
          <div className="supplier-documents-body">
            <DataGrid columns={documentColumns} data={documents} emptyMessage="لا توجد مستندات صادر محفوظة لهذا العميل." />
          </div>
        </section>
      </div>

      {selectedDoc && (
        <section className="supplier-document-preview">
          <div className="supplier-preview-header">
            <div>
              <h3>معاينة مستند صادر: {selectedDoc.doc_number}</h3>
              <p className="text-sm text-slate-500 mt-1">يمكنك مراجعة المستند قبل الطباعة.</p>
            </div>
            <button onClick={() => printOutgoingDocument(recipient, selectedDoc)} className="modern-btn primary"><Printer className="w-4 h-4" />طباعة</button>
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
