import { useEffect, useMemo, useState } from 'react';
import { Barcode, FileDown, Printer, QrCode, RefreshCw, Save } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import DataGrid from '../components/DataGrid';
import { api } from '../lib/api';
import { exportCsv, safePrint, showToast } from '../lib/uiActions';

type LabelRow = {
  id: number;
  item_name: string;
  sku: string;
  barcode: string;
  qr_code: string;
  labels_count: number;
  label_size: string;
  created_at: string;
};

type ItemOption = {
  id: number;
  name: string;
  sku?: string;
  barcode?: string;
  qr_code?: string;
};

function hashText(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

function barcodeBars(value: string) {
  const source = value || '000000000000';
  const hash = hashText(source);
  return Array.from({ length: 42 }, (_, index) => {
    const digit = Number(source[index % source.length]) || ((hash + index) % 9);
    return {
      width: 1 + ((digit + index) % 3),
      active: (digit + index + hash) % 4 !== 0,
    };
  });
}

function qrCells(value: string) {
  const hash = hashText(value || 'QR');
  return Array.from({ length: 121 }, (_, index) => {
    const row = Math.floor(index / 11);
    const col = index % 11;
    const finder = (row < 3 && col < 3) || (row < 3 && col > 7) || (row > 7 && col < 3);
    return finder || ((hash + row * 7 + col * 11 + index) % 5 < 2);
  });
}

export default function BarcodeLabels() {
  const [rows, setRows] = useState<LabelRow[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [labelsCount, setLabelsCount] = useState(10);
  const [labelSize, setLabelSize] = useState('50x30mm');
  const [preview, setPreview] = useState<LabelRow | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [labels, itemData] = await Promise.all([api.barcodeLabels(), api.items()]);
      setRows(labels);
      setItems(itemData);
      if (!selectedItemId && itemData.length) setSelectedItemId(String(itemData[0].id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const selectedItem = useMemo(() => items.find((item) => String(item.id) === selectedItemId), [items, selectedItemId]);

  const buildPreview = () => {
    if (!selectedItem) {
      showToast('اختر الصنف أولًا لعرض معاينة الملصق.');
      return null;
    }

    const next: LabelRow = {
      id: Date.now(),
      item_name: selectedItem.name,
      sku: selectedItem.sku || `SKU-${selectedItem.id}`,
      barcode: selectedItem.barcode || `BC-${selectedItem.id}`,
      qr_code: selectedItem.qr_code || `QR-${selectedItem.id}`,
      labels_count: Math.max(1, Number(labelsCount) || 1),
      label_size: labelSize,
      created_at: new Date().toISOString().slice(0, 10),
    };
    setPreview(next);
    showToast('تم تجهيز معاينة الملصق.');
    return next;
  };

  const savePreview = async () => {
    const label = preview ?? buildPreview();
    if (!label) return;
    await api.createBarcodeLabel(label);
    await load();
    setPreview(label);
    showToast('تم حفظ الملصق في القائمة.');
  };

  const printPreview = () => {
    if (!preview) {
      showToast('جهّز المعاينة أولًا قبل الطباعة.');
      return;
    }
    safePrint(`ملصق ${preview.item_name}`);
  };

  const columns = [
    { key: 'item_name', header: 'الصنف', width: '220px' },
    { key: 'sku', header: 'SKU', width: '120px' },
    { key: 'barcode', header: 'Barcode', width: '150px' },
    { key: 'qr_code', header: 'QR', width: '150px' },
    { key: 'labels_count', header: 'عدد الملصقات', width: '120px' },
    { key: 'label_size', header: 'حجم الملصق', width: '120px' },
    { key: 'created_at', header: 'تاريخ الإنشاء', width: '140px' },
    {
      key: 'actions',
      header: 'إجراءات',
      width: '120px',
      render: (row: LabelRow) => (
        <button type="button" onClick={() => setPreview(row)} className="px-2 py-1 text-xs border border-slate-300 rounded hover:bg-blue-50">معاينة</button>
      ),
    },
  ];

  const bars = barcodeBars(preview?.barcode ?? '');
  const cells = qrCells(preview?.qr_code ?? '');

  return (
    <div className="space-y-4">
      <Toolbar title="ملصقات الباركود و QR">
        <button onClick={buildPreview} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded"><RefreshCw className="w-4 h-4" />تجهيز المعاينة</button>
        <button onClick={savePreview} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><Save className="w-4 h-4" />حفظ الملصق</button>
        <button onClick={printPreview} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><Printer className="w-4 h-4" />طباعة المعاينة</button>
        <button onClick={() => exportCsv('ملصقات الباركود', rows as unknown as Record<string, unknown>[])} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50"><FileDown className="w-4 h-4" />تصدير</button>
      </Toolbar>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded shadow-sm p-4 lg:col-span-1">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Barcode className="w-4 h-4 text-teal-600" />إنشاء ملصقات</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">الصنف</label>
              <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white">
                <option value="">اختر الصنف</option>
                {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-slate-600 mb-1">العدد</label><input type="number" min={1} value={labelsCount} onChange={(e) => setLabelsCount(Number(e.target.value))} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">الحجم</label><select value={labelSize} onChange={(e) => setLabelSize(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"><option>50x30mm</option><option>60x40mm</option><option>A4</option></select></div>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 leading-relaxed">
              المعاينة الآن تعتمد على الصنف المحدد وتعرض Barcode و QR وقيمتهما الفعلية من بيانات الصنف.
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded shadow-sm p-4 lg:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><QrCode className="w-4 h-4 text-blue-600" />معاينة الملصق</h3>
          {preview ? (
            <div className="flex flex-col items-center gap-4">
              <div className="border border-slate-300 bg-white rounded shadow-sm p-4 w-full max-w-md print:shadow-none" dir="ltr">
                <div className="text-center text-sm font-bold text-slate-900" dir="rtl">{preview.item_name}</div>
                <div className="text-center text-xs text-slate-500 mb-2">SKU: {preview.sku}</div>
                <div className="flex justify-center items-end gap-[2px] h-20 border-y border-slate-200 py-2 bg-white overflow-hidden">
                  {bars.map((bar, index) => <span key={index} style={{ width: `${bar.width * 2}px`, height: `${bar.active ? 54 : 18}px` }} className={bar.active ? 'bg-slate-950 inline-block' : 'bg-transparent inline-block'} />)}
                </div>
                <div className="text-center text-xs tracking-widest mt-1 text-slate-700">{preview.barcode}</div>
                <div className="mt-3 flex justify-center">
                  <div className="grid grid-cols-11 gap-[2px] border border-slate-900 p-1 bg-white">
                    {cells.map((cell, index) => <span key={index} className={`w-2.5 h-2.5 ${cell ? 'bg-slate-950' : 'bg-white'}`} />)}
                  </div>
                </div>
                <div className="text-center text-xs mt-1 text-slate-700">{preview.qr_code}</div>
                <div className="text-center text-[11px] mt-2 text-slate-500" dir="rtl">الحجم: {preview.label_size} — العدد: {preview.labels_count}</div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-300 rounded h-56 flex flex-col items-center justify-center text-slate-500">
              <Barcode className="w-16 h-16 mb-2" />
              <span className="text-sm">اختر صنفًا واضغط تجهيز المعاينة</span>
              <span className="text-xs mt-1">ستظهر المعاينة هنا قبل الطباعة أو الحفظ</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <DataGrid columns={columns} data={rows} loading={loading} />
      </div>
    </div>
  );
}
