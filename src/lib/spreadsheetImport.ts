export type SpreadsheetRow = Record<string, string>;

function decodeUtf8(buffer: ArrayBuffer) {
  return new TextDecoder('utf-8').decode(buffer);
}

function parseDelimited(text: string, delimiter?: string): SpreadsheetRow[] {
  const sep = delimiter ?? (text.includes('\t') ? '\t' : ',');
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === sep && !quoted) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(current.trim());
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some((cell) => cell !== '')) rows.push(row);
  if (!rows.length) return [];

  const headers = rows[0].map((header, index) => header || `Column ${index + 1}`);
  return rows.slice(1).map((cells) => {
    const result: SpreadsheetRow = {};
    headers.forEach((header, index) => { result[header] = cells[index] ?? ''; });
    return result;
  }).filter((item) => Object.values(item).some((value) => value !== ''));
}

function findEndOfCentralDirectory(view: DataView) {
  for (let offset = view.byteLength - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset;
  }
  throw new Error('تعذر قراءة ملف Excel.');
}

type ZipEntry = {
  name: string;
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
};

function listZipEntries(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  const eocd = findEndOfCentralDirectory(view);
  const centralDirOffset = view.getUint32(eocd + 16, true);
  const totalEntries = view.getUint16(eocd + 10, true);
  const entries = new Map<string, ZipEntry>();
  let offset = centralDirOffset;

  for (let i = 0; i < totalEntries; i += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(new Uint8Array(buffer, offset + 46, nameLength));
    entries.set(name, { name, method, compressedSize, localHeaderOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

async function inflateRaw(data: Uint8Array) {
  const Ctor = (globalThis as unknown as { DecompressionStream?: new (format: string) => TransformStream<Uint8Array, Uint8Array> }).DecompressionStream;
  if (!Ctor) throw new Error('المتصفح لا يدعم قراءة ملفات xlsx مباشرة. احفظ الملف بصيغة CSV ثم أعد الاستيراد.');
  const dataBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const stream = new Blob([dataBuffer]).stream().pipeThrough(new Ctor('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZipText(buffer: ArrayBuffer, entries: Map<string, ZipEntry>, name: string) {
  const entry = entries.get(name);
  if (!entry) return '';
  const view = new DataView(buffer);
  const local = entry.localHeaderOffset;
  if (view.getUint32(local, true) !== 0x04034b50) throw new Error('تعذر قراءة ملف Excel.');
  const nameLength = view.getUint16(local + 26, true);
  const extraLength = view.getUint16(local + 28, true);
  const dataOffset = local + 30 + nameLength + extraLength;
  const compressed = new Uint8Array(buffer, dataOffset, entry.compressedSize);
  const data = entry.method === 0 ? compressed : entry.method === 8 ? await inflateRaw(compressed) : undefined;
  if (!data) throw new Error('نوع ضغط ملف Excel غير مدعوم.');
  return new TextDecoder('utf-8').decode(data);
}

function textFromCell(cell: Element, sharedStrings: string[]) {
  const type = cell.getAttribute('t');
  if (type === 'inlineStr') {
    return Array.from(cell.getElementsByTagName('t')).map((node) => node.textContent ?? '').join('');
  }
  const value = cell.getElementsByTagName('v')[0]?.textContent ?? '';
  if (type === 's') return sharedStrings[Number(value)] ?? '';
  return value;
}

function cellColumnIndex(reference: string | null, fallback: number) {
  if (!reference) return fallback;
  const letters = reference.match(/[A-Z]+/i)?.[0] ?? '';
  if (!letters) return fallback;
  return letters.toUpperCase().split('').reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

async function parseXlsx(buffer: ArrayBuffer): Promise<SpreadsheetRow[]> {
  const entries = listZipEntries(buffer);
  const sharedXml = await readZipText(buffer, entries, 'xl/sharedStrings.xml');
  const parser = new DOMParser();
  const sharedStrings = sharedXml
    ? Array.from(parser.parseFromString(sharedXml, 'application/xml').getElementsByTagName('si'))
        .map((node) => Array.from(node.getElementsByTagName('t')).map((t) => t.textContent ?? '').join(''))
    : [];

  const sheetName = entries.has('xl/worksheets/sheet1.xml')
    ? 'xl/worksheets/sheet1.xml'
    : Array.from(entries.keys()).find((name) => name.startsWith('xl/worksheets/sheet'));
  if (!sheetName) throw new Error('لم يتم العثور على Sheet داخل ملف Excel.');

  const sheetXml = await readZipText(buffer, entries, sheetName);
  const sheet = parser.parseFromString(sheetXml, 'application/xml');
  const rawRows = Array.from(sheet.getElementsByTagName('row')).map((rowNode) => {
    const cells: string[] = [];
    Array.from(rowNode.getElementsByTagName('c')).forEach((cell, fallbackIndex) => {
      const index = cellColumnIndex(cell.getAttribute('r'), fallbackIndex);
      cells[index] = textFromCell(cell, sharedStrings).trim();
    });
    return cells;
  }).filter((row) => row.some((cell) => cell));

  if (!rawRows.length) return [];
  const headers = rawRows[0].map((header, index) => header || `Column ${index + 1}`);
  return rawRows.slice(1).map((cells) => {
    const result: SpreadsheetRow = {};
    headers.forEach((header, index) => { result[header] = cells[index] ?? ''; });
    return result;
  }).filter((item) => Object.values(item).some((value) => value !== ''));
}

export async function readSpreadsheetRows(file: File): Promise<SpreadsheetRow[]> {
  const buffer = await file.arrayBuffer();
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.xlsx')) return parseXlsx(buffer);
  return parseDelimited(decodeUtf8(buffer));
}
