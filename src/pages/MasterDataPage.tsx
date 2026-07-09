import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Eye, FileDown, Plus, Power, Printer, Search, Trash2, Upload } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import SearchBox from '../components/SearchBox';
import DataGrid from '../components/DataGrid';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';
import { disabledMessage, exportCsv, hardDeletedMessage, safePrint } from '../lib/uiActions';
import { printCompanyDocument } from '../lib/companyPrint';
import { readSpreadsheetRows, type SpreadsheetRow } from '../lib/spreadsheetImport';
import { mapCustomerImportRow } from '../lib/importMappings';

type FieldType = 'text' | 'email' | 'number' | 'select';

export interface MasterField {
  key: string;
  label: string;
  required?: boolean;
  type?: FieldType;
  options?: { value: string; label: string }[];
}

export interface MasterPageConfig {
  title: string;
  newButtonLabel: string;
  searchPlaceholder: string;
  load: () => Promise<MasterRecord[]>;
  create: (body: Record<string, FormDataEntryValue>) => Promise<unknown>;
  update: (body: Record<string, FormDataEntryValue | number>) => Promise<unknown>;
  disable: (id: number) => Promise<unknown>;
  remove: (id: number) => Promise<unknown>;
  fields: MasterField[];
  columns: { key: string; header: string; width?: string }[];
  viewPath?: (row: MasterRecord) => string;
  officialPrintTitle?: string;
  officialPrintLabel?: string;
  importFromExcel?: boolean;
  mapImportRow?: (row: SpreadsheetRow) => Record<string, string | number>;
}

type MasterRecord = Record<string, string | number | boolean | null | undefined> & { id: number; status?: string };

export default function MasterDataPage({ config }: { config: MasterPageConfig }) {
  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MasterRecord | null>(null);
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setRecords(await config.load());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((record) =>
      Object.values(record).some((value) => String(value ?? '').toLowerCase().includes(q)),
    );
  }, [records, search]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      if (editing) await config.update({ ...body, id: editing.id });
      else await config.create(body);
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (error) {
      alert((error as Error).message);
    }
  };


  const exportRows = (rows: MasterRecord[] = filtered) => rows.map((row) => Object.fromEntries(
    config.columns
      .filter((column) => column.key !== 'actions')
      .map((column) => [column.header, row[column.key]]),
  ));

  const printOfficial = (rows: MasterRecord[] = filtered) => {
    const printColumns = config.columns.filter((column) => column.key !== 'status').slice(0, 6);
    printCompanyDocument({
      title: config.officialPrintTitle ?? config.title,
      documentLabel: config.officialPrintLabel ?? 'مستند رسمي صادر عن النظام',
      meta: [
        { label: 'عدد السجلات', value: rows.length },
        { label: 'الصفحة', value: config.title },
      ],
      columns: [
        ...printColumns,
        { key: 'status', header: 'الحالة', align: 'center' },
      ],
      rows: rows as unknown as Record<string, unknown>[],
      summary: [{ label: 'عدد السجلات', value: rows.length }],
    });
  };

  const handleImport = async (file?: File) => {
    if (!file || !config.importFromExcel || !config.mapImportRow) return;
    try {
      const spreadsheetRows = await readSpreadsheetRows(file);
      const mapped = spreadsheetRows.map(config.mapImportRow).filter((row) => String(row.name || '').trim());
      if (!mapped.length) {
        window.alert('لم يتم العثور على سجلات صالحة للاستيراد. تأكد من وجود عمود الاسم المطلوب.');
        return;
      }
      for (const row of mapped) await config.create(row as Record<string, FormDataEntryValue>);
      await load();
      window.alert(`تم استيراد ${mapped.length} سجل بنجاح.`);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const columns = [
    ...config.columns.map((column) => ({
      ...column,
      render: column.key === 'status' ? (row: MasterRecord) => <StatusBadge status={String(row.status || 'active')} /> : undefined,
    })),
    {
      key: 'actions',
      header: 'إجراءات',
      width: '160px',
      render: (row: MasterRecord) => (
        <div className="flex items-center gap-1">
          {config.viewPath && (
            <button onClick={() => navigate(config.viewPath!(row))} className="p-1 rounded hover:bg-indigo-50 text-indigo-600" title="عرض الملف">
              <Eye className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => { setEditing(row); setShowForm(true); }} className="p-1 rounded hover:bg-blue-50 text-blue-600" title="تعديل">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => { if (window.confirm('هل تريد تعطيل هذا السجل؟')) void config.disable(row.id).then(() => { disabledMessage(); return load(); }); }} className="p-1 rounded hover:bg-orange-50 text-orange-600" title="تعطيل">
            <Power className="w-4 h-4" />
          </button>
          <button onClick={() => { if (window.confirm('هل تريد حذف هذا السجل نهائيًا من النسخة المحلية؟')) void config.remove(row.id).then(() => { hardDeletedMessage(); return load(); }); }} className="p-1 rounded hover:bg-red-50 text-red-600" title="حذف">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => config.officialPrintTitle ? printOfficial([row]) : safePrint(`${config.title} - ${row.id}`)} className="p-1 rounded hover:bg-slate-100 text-slate-600" title="طباعة">
            <Printer className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Toolbar title={config.title}>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded">
          <Plus className="w-4 h-4" />
          {config.newButtonLabel}
        </button>
        <button onClick={() => config.officialPrintTitle ? printOfficial() : safePrint(config.title)} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50">
          <Printer className="w-4 h-4" />
          طباعة
        </button>
        <button onClick={() => exportCsv(config.title, exportRows())} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50">
          <FileDown className="w-4 h-4" />
          تصدير
        </button>
        {config.importFromExcel && (
          <>
            <button onClick={() => importInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded hover:bg-slate-50">
              <Upload className="w-4 h-4" />
              استيراد من Excel
            </button>
            <input ref={importInputRef} type="file" accept=".xlsx,.csv,.tsv,.txt" className="hidden" onChange={(e) => void handleImport(e.target.files?.[0])} />
          </>
        )}
      </Toolbar>

      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <SearchBox value={search} onChange={setSearch} placeholder={config.searchPlaceholder} />
          <Search className="w-4 h-4 text-slate-400" />
          <div className="mr-auto text-xs text-slate-500">عدد السجلات: <span className="font-bold text-slate-700">{filtered.length}</span></div>
        </div>
        <DataGrid columns={columns} data={filtered} loading={loading} />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{editing ? `تعديل - ${config.title}` : config.newButtonLabel}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <form onSubmit={handleSave} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
                  {field.type === 'select' ? (
                    <select name={field.key} defaultValue={String(editing?.[field.key] ?? field.options?.[0]?.value ?? '')} required={field.required} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white">
                      {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : (
                    <input name={field.key} type={field.type || 'text'} defaultValue={String(editing?.[field.key] ?? '')} required={field.required} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                  )}
                </div>
              ))}
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 rounded text-sm hover:bg-slate-50">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded text-sm hover:bg-teal-700">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export const configs = {
  categories: {
    title: 'التصنيفات',
    newButtonLabel: 'تصنيف جديد',
    searchPlaceholder: 'بحث في التصنيفات',
    load: api.categories,
    create: api.createCategory,
    update: api.updateCategory,
    disable: api.deleteCategory,
    remove: api.hardDeleteCategory,
    fields: [
      { key: 'name', label: 'اسم التصنيف', required: true },
      { key: 'notes', label: 'ملاحظات' },
      { key: 'status', label: 'الحالة', type: 'select', options: [{ value: 'active', label: 'مفعّل' }, { value: 'inactive', label: 'معطّل' }] },
    ],
    columns: [
      { key: 'name', header: 'اسم التصنيف', width: '220px' },
      { key: 'notes', header: 'ملاحظات', width: 'auto' },
      { key: 'status', header: 'الحالة', width: '100px' },
    ],
  },
  units: {
    title: 'الوحدات',
    newButtonLabel: 'وحدة جديدة',
    searchPlaceholder: 'بحث في الوحدات',
    load: api.units,
    create: api.createUnit,
    update: api.updateUnit,
    disable: api.deleteUnit,
    remove: api.hardDeleteUnit,
    fields: [
      { key: 'name', label: 'اسم الوحدة', required: true },
      { key: 'symbol', label: 'الرمز' },
      { key: 'status', label: 'الحالة', type: 'select', options: [{ value: 'active', label: 'مفعّل' }, { value: 'inactive', label: 'معطّل' }] },
    ],
    columns: [
      { key: 'name', header: 'اسم الوحدة', width: '220px' },
      { key: 'symbol', header: 'الرمز', width: '120px' },
      { key: 'status', header: 'الحالة', width: '100px' },
    ],
  },
  brands: {
    title: 'العلامات التجارية',
    newButtonLabel: 'علامة جديدة',
    searchPlaceholder: 'بحث في العلامات التجارية',
    load: api.brands,
    create: api.createBrand,
    update: api.updateBrand,
    disable: api.deleteBrand,
    remove: api.hardDeleteBrand,
    fields: [
      { key: 'name', label: 'اسم العلامة', required: true },
      { key: 'notes', label: 'ملاحظات' },
      { key: 'status', label: 'الحالة', type: 'select', options: [{ value: 'active', label: 'مفعّل' }, { value: 'inactive', label: 'معطّل' }] },
    ],
    columns: [
      { key: 'name', header: 'اسم العلامة', width: '220px' },
      { key: 'notes', header: 'ملاحظات', width: 'auto' },
      { key: 'status', header: 'الحالة', width: '100px' },
    ],
  },
  manufacturers: {
    title: 'الشركات المصنعة',
    newButtonLabel: 'شركة مصنعة جديدة',
    searchPlaceholder: 'بحث في الشركات المصنعة',
    load: api.manufacturers,
    create: api.createManufacturer,
    update: api.updateManufacturer,
    disable: api.deleteManufacturer,
    remove: api.hardDeleteManufacturer,
    fields: [
      { key: 'name', label: 'اسم الشركة', required: true },
      { key: 'country', label: 'الدولة' },
      { key: 'notes', label: 'ملاحظات' },
      { key: 'status', label: 'الحالة', type: 'select', options: [{ value: 'active', label: 'مفعّل' }, { value: 'inactive', label: 'معطّل' }] },
    ],
    columns: [
      { key: 'name', header: 'اسم الشركة', width: '220px' },
      { key: 'country', header: 'الدولة', width: '130px' },
      { key: 'notes', header: 'ملاحظات', width: 'auto' },
      { key: 'status', header: 'الحالة', width: '100px' },
    ],
  },
  suppliers: {
    title: 'المورّدون',
    newButtonLabel: 'مورّد جديد',
    searchPlaceholder: 'بحث باسم المورد أو الهاتف أو البريد',
    load: api.suppliers,
    create: api.createSupplier,
    update: api.updateSupplier,
    disable: api.deleteSupplier,
    remove: api.hardDeleteSupplier,
    fields: [
      { key: 'name', label: 'اسم المورد', required: true },
      { key: 'contact', label: 'الشخص المسؤول' },
      { key: 'phone', label: 'الهاتف' },
      { key: 'email', label: 'البريد الإلكتروني', type: 'email' },
      { key: 'address', label: 'العنوان' },
      { key: 'status', label: 'الحالة', type: 'select', options: [{ value: 'active', label: 'مفعّل' }, { value: 'inactive', label: 'معطّل' }] },
    ],
    viewPath: (row) => `/suppliers/${row.id}`,
    columns: [
      { key: 'name', header: 'اسم المورد', width: '220px' },
      { key: 'contact', header: 'المسؤول', width: '150px' },
      { key: 'phone', header: 'الهاتف', width: '140px' },
      { key: 'email', header: 'البريد الإلكتروني', width: '190px' },
      { key: 'status', header: 'الحالة', width: '100px' },
    ],
  },
  recipients: {
    title: 'العملاء',
    newButtonLabel: 'عميل جديد',
    searchPlaceholder: 'بحث باسم العميل أو الهاتف أو البريد',
    load: api.recipients,
    create: api.createRecipient,
    update: api.updateRecipient,
    disable: api.deleteRecipient,
    remove: api.hardDeleteRecipient,
    officialPrintTitle: 'فاتورة العملاء',
    officialPrintLabel: 'فاتورة رسمية خاصة بالعملاء',
    importFromExcel: true,
    mapImportRow: mapCustomerImportRow,
    fields: [
      { key: 'name', label: 'اسم العميل', required: true },
      { key: 'type', label: 'نوع العميل/الجهة', type: 'select', options: [
        { value: 'عميل', label: 'عميل' },
        { value: 'فرع', label: 'فرع' },
        { value: 'قسم داخلي', label: 'قسم داخلي' },
        { value: 'مشروع', label: 'مشروع' },
        { value: 'موظف', label: 'موظف' },
        { value: 'جهة خارجية', label: 'جهة خارجية' },
      ] },
      { key: 'phone', label: 'الهاتف' },
      { key: 'email', label: 'البريد الإلكتروني', type: 'email' },
      { key: 'address', label: 'العنوان' },
      { key: 'status', label: 'الحالة', type: 'select', options: [{ value: 'active', label: 'مفعّل' }, { value: 'inactive', label: 'معطّل' }] },
    ],
    viewPath: (row) => `/recipients/${row.id}`,
    columns: [
      { key: 'name', header: 'اسم العميل', width: '220px' },
      { key: 'type', header: 'النوع', width: '120px' },
      { key: 'phone', header: 'الهاتف', width: '140px' },
      { key: 'status', header: 'الحالة', width: '100px' },
    ],
  },
} satisfies Record<string, MasterPageConfig>;
