import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { triggerRestore } from './db-wake.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const dataDir = path.join(projectRoot, '.data');
const dataFile = path.join(dataDir, 'wms-data.json');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const tableKeyMap = {
  categories: 'categories',
  units: 'units',
  brands: 'brands',
  manufacturers: 'manufacturers',
  suppliers: 'suppliers',
  recipients: 'recipients',
  warehouses: 'warehouses',
  storage_locations: 'locations',
  locations: 'locations',
  items: 'items',
  current_stock: 'currentStock',
  stock_movements: 'stockMovements',
  incoming_docs: 'incomingDocs',
  incoming_items: 'incomingItems',
  outgoing_docs: 'outgoingDocs',
  outgoing_items: 'outgoingItems',
  transfers: 'transfers',
  transfer_items: 'transferItems',
  inventory_counts: 'inventoryCounts',
  inventory_count_items: 'inventoryCountItems',
  activity_log: 'activityLog',
  settings: 'settings',
  backups: 'backups',
  barcode_labels: 'barcodeLabels',
};

function loadSeedFromFrontend() {
  const sourcePath = path.join(projectRoot, 'src', 'lib', 'mockData.ts');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const start = source.indexOf('const today');
  const end = source.indexOf('export type MockDataKey');
  if (start === -1 || end === -1) throw new Error('Unable to read seed data.');
  const script = source
    .slice(start, end)
    .replace('export const mockData =', 'const mockData =');
  const sandbox = { Date, JSON };
  return vm.runInNewContext(`${script}\nmockData;`, sandbox);
}

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (fs.existsSync(dataFile)) return;
  const seed = loadSeedFromFrontend();
  const initial = {
    ...seed,
    incomingItems: [],
    outgoingItems: [],
    transferItems: [],
    inventoryCountItems: [],
  };
  fs.writeFileSync(dataFile, JSON.stringify(initial, null, 2));
}

function readStore() {
  ensureDataFile();
  const raw = fs.readFileSync(dataFile, 'utf8');
  return JSON.parse(raw);
}

function writeStore(store) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeTable(table) {
  return tableKeyMap[table] || table;
}

function nextId(rows) {
  return rows.reduce((max, row) => Math.max(max, Number(row?.id) || 0), 0) + 1;
}

class LocalQueryBuilder {
  constructor(table) {
    this.table = table;
    this.key = normalizeTable(table);
    this.operation = 'select';
    this.payload = null;
    this.filters = [];
    this.sortColumn = null;
    this.sortAscending = true;
    this.maxRows = null;
    this.singleRow = false;
  }

  select() {
    if (!this.operation) this.operation = 'select';
    return this;
  }

  order(column, options = {}) {
    this.sortColumn = column;
    this.sortAscending = options.ascending !== false;
    return this;
  }

  limit(value) {
    this.maxRows = Number(value);
    return this;
  }

  insert(payload) {
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload) {
    this.operation = 'update';
    this.payload = payload || {};
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, value });
    return this;
  }

  single() {
    this.singleRow = true;
    return this;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  catch(reject) {
    return this.execute().catch(reject);
  }

  matches(row) {
    return this.filters.every(({ column, value }) => String(row?.[column]) === String(value));
  }

  applySortAndLimit(rows) {
    let result = [...rows];
    if (this.sortColumn) {
      result.sort((a, b) => {
        const av = a?.[this.sortColumn];
        const bv = b?.[this.sortColumn];
        const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true, sensitivity: 'base' });
        return this.sortAscending ? cmp : -cmp;
      });
    }
    if (Number.isFinite(this.maxRows)) result = result.slice(0, this.maxRows);
    return result;
  }

  async execute() {
    try {
      const store = readStore();
      const currentRows = Array.isArray(store[this.key]) ? store[this.key] : [];

      if (this.operation === 'insert') {
        const inputRows = Array.isArray(this.payload) ? this.payload : [this.payload];
        let id = nextId(currentRows);
        const now = new Date().toISOString();
        const created = inputRows.map((row) => ({ id: id++, created_at: now, status: 'active', ...(row || {}) }));
        store[this.key] = [...created, ...currentRows];
        writeStore(store);
        const data = this.singleRow ? created[0] : created;
        return { data: clone(data), error: null };
      }

      if (this.operation === 'update') {
        let updatedRows = [];
        const now = new Date().toISOString();
        store[this.key] = currentRows.map((row) => {
          if (!this.matches(row)) return row;
          const updated = { ...row, ...(this.payload || {}), updated_at: now };
          updatedRows.push(updated);
          return updated;
        });
        writeStore(store);
        const data = this.singleRow ? (updatedRows[0] || null) : updatedRows;
        return { data: clone(data), error: null };
      }

      if (this.operation === 'delete') {
        const remaining = currentRows.filter((row) => !this.matches(row));
        store[this.key] = remaining;
        writeStore(store);
        return { data: null, error: null };
      }

      let rows = currentRows.filter((row) => this.matches(row));
      rows = this.applySortAndLimit(rows);
      const data = this.singleRow ? (rows[0] || null) : rows;
      return { data: clone(data), error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

function createLocalClient() {
  return {
    from(table) {
      return new LocalQueryBuilder(table);
    },
  };
}

const supabase = url && serviceKey
  ? createClient(url, serviceKey, {
      global: {
        fetch: async (requestUrl, options) => {
          const res = await fetch(requestUrl, options);
          if (!res.ok && res.status >= 500) triggerRestore();
          return res;
        },
      },
    })
  : createLocalClient();

export function isLocalDatabase() {
  return !(url && serviceKey);
}

export default supabase;
