export type ExportableRecord = Record<string, unknown>;

export function showToast(message: string) {
  window.alert(message);
}

export function safePrint(title = 'طباعة') {
  document.title = title;
  window.print();
}

function toCsvValue(value: unknown) {
  const text = String(value ?? '').replace(/"/g, '""');
  return `"${text}"`;
}

export function exportCsv(filename: string, rows: ExportableRecord[]) {
  if (!rows.length) {
    showToast('لا توجد بيانات للتصدير.');
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [headers.map(toCsvValue).join(','), ...rows.map((row) => headers.map((key) => toCsvValue(row[key])).join(','))].join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportPdfPlaceholder(title: string) {
  showToast(`تم تجهيز ${title}. استخدم نافذة الطباعة واختر Save as PDF.`);
  safePrint(title);
}

export function resetFormMessage() {
  showToast('تم تجهيز شاشة جديدة.');
}

export function cancelMessage() {
  showToast('تم إلغاء العملية الحالية بدون تعديل البيانات.');
}

export function disabledMessage() {
  showToast('تم تعطيل السجل محليًا.');
}

export function detailsMessage(title: string, details?: string) {
  showToast(`${title}${details ? `\n${details}` : ''}`);
}


export function hardDeletedMessage() {
  showToast('تم حذف السجل محليًا.');
}
