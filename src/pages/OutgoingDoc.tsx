import { useEffect, useMemo, useState } from 'react';
import { Save, Printer, X, Plus, Trash2, Edit, FilePlus, FileDown, RotateCcw } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import { api } from '../lib/api';
import { cancelMessage, exportPdfPlaceholder, resetFormMessage } from '../lib/uiActions';
import { printCompanyDocument } from '../lib/companyPrint';

interface Line {
  id: number;
  item_name: string;
  qty: number;
  unit: string;
  location: string;
  notes: string;
}

export default function OutgoingDoc() {
  const [docNumber, setDocNumber] = useState('OUT-2025-0001');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [recipient, setRecipient] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [employee, setEmployee] = useState('أحمد المدير');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([api.recipients(), api.warehouses(), api.locations()]).then(([r, w, l]) => {
      setRecipients(r);
      setLocations(l);
      setWarehouse(String(w?.[0]?.name ?? ''));
    });
  }, []);

  const addLine = () => {
    setLines((prev) => [...prev, { id: Date.now(), item_name: '', qty: 1, unit: 'قطعة', location: '', notes: '' }]);
  };

  const updateLine = (id: number, field: keyof Line, value: any) => {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, [field]: value } : line)));
  };

  const removeLine = (id: number) => setLines((prev) => prev.filter((l) => l.id !== id));
  const saveLine = (id: number) => {
    const line = lines.find((item) => item.id === id);
    if (!line) return;
    window.alert('تم حفظ السطر داخل الجدول.');
  };
  const editLine = (id: number) => {
    const line = lines.find((item) => item.id === id);
    if (!line) return;
    window.alert('يمكنك تعديل السطر مباشرة من الحقول، ثم الضغط على حفظ.');
  };

  const totalQty = useMemo(() => lines.reduce((sum, l) => sum + (Number(l.qty) || 0), 0), [lines]);

  const clearDocument = () => {
    setLines([]);
    setNotes('');
    resetFormMessage();
  };

  const saveDoc = async () => {
    try {
      await api.createOutgoingDoc({
        doc_number: docNumber,
        doc_date: docDate,
        recipient,
        warehouse,
        employee,
        status: 'approved',
        notes,
        total_qty: totalQty,
        items: lines,
      });
      alert('تم حفظ مستند الصادر بنجاح.');
    } catch (err) { alert((err as Error).message); }
  };

  const printInvoice = () => {
    printCompanyDocument({
      title: 'فاتورة بضائع صادرة',
      documentLabel: 'فاتورة رسمية خاصة بالبضائع الصادرة',
      meta: [
        { label: 'رقم المستند', value: docNumber },
        { label: 'التاريخ', value: docDate },
        { label: 'العميل/الجهة', value: recipient || '-' },
        { label: 'المستودع', value: warehouse || '-' },
        { label: 'الموظّف', value: employee || '-' },
        { label: 'عدد الأصناف', value: lines.length },
      ],
      columns: [
        { key: 'item_name', header: 'الصنف' },
        { key: 'qty', header: 'الكمية', align: 'center' },
        { key: 'unit', header: 'الوحدة', align: 'center' },
        { key: 'location', header: 'موقع السحب' },
        { key: 'notes', header: 'ملاحظات' },
      ],
      rows: lines as unknown as Record<string, unknown>[],
      summary: [
        { label: 'إجمالي الكميات', value: totalQty },
        { label: 'عدد الأصناف', value: lines.length },
      ],
      notes,
    });
  };

  return (
    <div className="space-y-4">
      <Toolbar title="مستند صادر">
        <button onClick={clearDocument} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><RotateCcw className="w-4 h-4" />جديد</button>
        <button onClick={saveDoc} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded"><Save className="w-4 h-4" />حفظ</button>
        <button onClick={printInvoice} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><Printer className="w-4 h-4" />طباعة</button>
        <button onClick={() => { clearDocument(); cancelMessage(); }} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><X className="w-4 h-4" />إلغاء</button>
        <button onClick={() => exportPdfPlaceholder('مستند صادر')} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><FileDown className="w-4 h-4" />PDF</button>
      </Toolbar>

      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 text-sm font-semibold text-slate-700">بيانات المستند</div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">رقم المستند</label>
            <input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">التاريخ</label>
            <input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">الجهة المستلمة</label>
            <select value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
              <option value="">اختر الجهة</option>
              {recipients.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">المستودع</label>
            <input value={warehouse} readOnly className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">الموظّف</label>
            <input value={employee} onChange={(e) => setEmployee(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">ملاحظات</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-sm font-semibold text-slate-700">أصناف المستند</span>
          <button onClick={addLine} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded"><Plus className="w-3.5 h-3.5" />إضافة صنف</button>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th className="text-right px-2 py-2 border-b border-slate-200 font-semibold text-xs">الصنف</th>
                <th className="text-right px-2 py-2 border-b border-slate-200 font-semibold text-xs w-20">الكمية</th>
                <th className="text-right px-2 py-2 border-b border-slate-200 font-semibold text-xs w-24">الوحدة</th>
                <th className="text-right px-2 py-2 border-b border-slate-200 font-semibold text-xs w-44">موقع السحب</th>
                <th className="text-right px-2 py-2 border-b border-slate-200 font-semibold text-xs w-40">ملاحظات</th>
                <th className="text-right px-2 py-2 border-b border-slate-200 font-semibold text-xs w-44">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-b border-slate-100">
                  <td className="px-2 py-1.5"><input value={line.item_name} onChange={(e) => updateLine(line.id, 'item_name', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 text-sm" placeholder="اسم الصنف" /></td>
                  <td className="px-2 py-1.5"><input type="number" value={line.qty} onChange={(e) => updateLine(line.id, 'qty', Number(e.target.value))} className="w-full border border-slate-300 rounded px-2 py-1 text-sm" /></td>
                  <td className="px-2 py-1.5"><input value={line.unit} onChange={(e) => updateLine(line.id, 'unit', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 text-sm" /></td>
                  <td className="px-2 py-1.5">
                    <select value={line.location} onChange={(e) => updateLine(line.id, 'location', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 text-sm">
                      <option value=""></option>
                      {locations.map((l) => <option key={l.id} value={`${l.warehouse} / ${l.zone}-${l.aisle}-${l.rack}-${l.level}-${l.bin}`}>{`${l.warehouse} / ${l.zone}-${l.aisle}-${l.rack}-${l.level}-${l.bin}`}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5"><input value={line.notes} onChange={(e) => updateLine(line.id, 'notes', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 text-sm" /></td>
                  <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => saveLine(line.id)} className="modern-btn xs secondary" title="حفظ السطر"><Save className="w-3.5 h-3.5" />حفظ</button>
                        <button onClick={() => editLine(line.id)} className="modern-btn xs secondary" title="تعديل السطر"><Edit className="w-3.5 h-3.5" />تعديل</button>
                        <button onClick={() => removeLine(line.id)} className="modern-btn xs danger" title="حذف السطر"><Trash2 className="w-3.5 h-3.5" />حذف</button>
                      </div>
                    </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">
                    <FilePlus className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    لا توجد أصناف. اضغط إضافة صنف للبدء.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="text-sm text-slate-600">عدد الأصناف: <span className="font-bold text-slate-800">{lines.length}</span></div>
          <div className="text-sm text-slate-600">إجمالي الكميات: <span className="font-bold text-red-700 text-lg">{totalQty}</span></div>
        </div>
      </div>
    </div>
  );
}
