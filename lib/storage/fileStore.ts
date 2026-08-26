import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "plaza_store.json");

export interface PlazaStoreData {
  plaza: {
    id: number | string;
    name: string;
    address?: string | null;
    description?: string | null;
    floors?: string[];
    active: boolean;
  };
  units: any[];
  tenants: any[];
  leases: any[];
  connections: any[];
  connection_unit_mappings: any[];
  bills: any[];
  payments: any[];
  expenses: any[];
  complaints: any[];
  complaint_expenses: any[];
}

const DEFAULT_STORE: PlazaStoreData = {
  plaza: {
    id: 1,
    name: "",
    address: "",
    description: "",
    floors: [],
    active: false,
  },
  units: [],
  tenants: [],
  leases: [],
  connections: [],
  connection_unit_mappings: [],
  bills: [],
  payments: [],
  expenses: [],
  complaints: [],
  complaint_expenses: [],
};

export function getStore(): PlazaStoreData {
 try {
 if (!fs.existsSync(DATA_DIR)) {
 fs.mkdirSync(DATA_DIR, { recursive: true });
 }
 if (!fs.existsSync(STORE_PATH)) {
 fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2), "utf8");
 return JSON.parse(JSON.stringify(DEFAULT_STORE));
 }
 const raw = fs.readFileSync(STORE_PATH, "utf8");
 const parsed = JSON.parse(raw);
 return {
 ...DEFAULT_STORE,
 ...parsed,
 plaza: { ...DEFAULT_STORE.plaza, ...(parsed.plaza || {}) },
 };
 } catch (err) {
 return JSON.parse(JSON.stringify(DEFAULT_STORE));
 }
}

export function saveStore(data: PlazaStoreData): void {
 try {
 if (!fs.existsSync(DATA_DIR)) {
 fs.mkdirSync(DATA_DIR, { recursive: true });
 }
 fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
 } catch (err) {
 console.error("Error saving store to disk:", err);
 }
}

export function updateStore(updater: (current: PlazaStoreData) => PlazaStoreData | void): PlazaStoreData {
 const current = getStore();
 const updated = updater(current) || current;
 saveStore(updated);
 return updated;
}
