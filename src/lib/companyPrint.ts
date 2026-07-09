export type PrintColumn<T extends Record<string, unknown>> = {
  key: keyof T | string;
  header: string;
  align?: 'start' | 'center' | 'end';
};

export type PrintMeta = { label: string; value: unknown };

export type CompanyPrintOptions<T extends Record<string, unknown>> = {
  title: string;
  documentLabel?: string;
  meta?: PrintMeta[];
  columns: PrintColumn<T>[];
  rows: T[];
  summary?: PrintMeta[];
  notes?: string;
};

const COMPANY_HEADER_SRC = '/company-header.jpeg';

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === '') return '-';
  return escapeHtml(value);
}

function buildMeta(meta: PrintMeta[] = []) {
  if (!meta.length) return '';
  return `<section class="meta-grid">${meta.map((item) => `
    <div class="meta-item">
      <span>${escapeHtml(item.label)}</span>
      <strong>${formatValue(item.value)}</strong>
    </div>`).join('')}</section>`;
}

function buildSummary(summary: PrintMeta[] = []) {
  if (!summary.length) return '';
  return `<section class="summary-grid">${summary.map((item) => `
    <div class="summary-item">
      <span>${escapeHtml(item.label)}</span>
      <strong>${formatValue(item.value)}</strong>
    </div>`).join('')}</section>`;
}

function buildTable<T extends Record<string, unknown>>(columns: PrintColumn<T>[], rows: T[]) {
  const header = columns.map((column) => `<th>${escapeHtml(column.header)}</th>`).join('');
  const body = rows.length
    ? rows.map((row, index) => `<tr>
        <td class="center">${index + 1}</td>
        ${columns.map((column) => `<td class="${column.align ?? ''}">${formatValue(row[column.key as keyof T])}</td>`).join('')}
      </tr>`).join('')
    : `<tr><td colspan="${columns.length + 1}" class="empty">لا توجد بيانات للطباعة</td></tr>`;

  return `<table>
    <thead><tr><th class="center serial">#</th>${header}</tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

export function printCompanyDocument<T extends Record<string, unknown>>(options: CompanyPrintOptions<T>) {
  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) {
    window.alert('تعذر فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة ثم المحاولة مرة أخرى.');
    return;
  }

  const printedAt = new Date().toLocaleString('ar-LB');
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(options.title)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; font-family: Arial, Tahoma, sans-serif; background: #fff; }
    .document { width: 100%; max-width: 1100px; margin: 0 auto; padding: 8px; }
    .company-header { display: block; width: 100%; max-width: 767px; height: auto; margin: 0 auto 14px; }
    .title-box { border: 2px solid #111827; border-radius: 10px; padding: 12px 16px; text-align: center; margin: 8px 0 14px; }
    .title-box h1 { margin: 0; font-size: 23px; font-weight: 800; }
    .title-box p { margin: 6px 0 0; font-size: 12px; color: #475569; }
    .meta-grid, .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0; }
    .meta-item, .summary-item { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; min-height: 54px; }
    .meta-item span, .summary-item span { display: block; font-size: 11px; color: #64748b; margin-bottom: 4px; }
    .meta-item strong, .summary-item strong { display: block; font-size: 14px; color: #0f172a; word-break: break-word; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; table-layout: fixed; }
    th, td { border: 1px solid #94a3b8; padding: 7px 6px; font-size: 11px; vertical-align: middle; word-break: break-word; }
    th { background: #f1f5f9; color: #0f172a; font-weight: 800; text-align: right; }
    td { text-align: right; }
    .center { text-align: center; }
    .end { text-align: left; }
    .serial { width: 36px; }
    .empty { text-align: center; color: #64748b; padding: 18px; }
    .notes { margin-top: 12px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; min-height: 58px; font-size: 12px; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 34px; }
    .signature { border-top: 1px solid #111827; text-align: center; padding-top: 8px; font-size: 12px; color: #334155; }
    .footer { margin-top: 16px; display: flex; justify-content: space-between; gap: 16px; font-size: 10px; color: #64748b; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .document { padding: 0; }
    }
  </style>
</head>
<body>
  <main class="document">
    <img class="company-header" src="${COMPANY_HEADER_SRC}" alt="Company header" />
    <section class="title-box">
      <h1>${escapeHtml(options.title)}</h1>
      <p>${escapeHtml(options.documentLabel ?? 'مستند رسمي صادر عن النظام')}</p>
    </section>
    ${buildMeta(options.meta)}
    ${buildTable(options.columns, options.rows)}
    ${buildSummary(options.summary)}
    ${options.notes ? `<section class="notes"><strong>ملاحظات:</strong><br />${formatValue(options.notes)}</section>` : ''}
    <section class="signatures">
      <div class="signature">إعداد</div>
      <div class="signature">تدقيق</div>
      <div class="signature">توقيع المسؤول</div>
    </section>
    <section class="footer">
      <span>تمت الطباعة بتاريخ: ${escapeHtml(printedAt)}</span>
      <span>هذه النسخة رسمية حسب بيانات النظام.</span>
    </section>
  </main>
  <script>
    const image = document.querySelector('.company-header');
    const runPrint = () => { window.focus(); window.print(); };
    if (image && !image.complete) image.addEventListener('load', () => setTimeout(runPrint, 200), { once: true });
    else setTimeout(runPrint, 200);
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
