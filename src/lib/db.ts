import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src", "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(collection: string): string {
  return path.join(DATA_DIR, `${collection}.json`);
}

export function readCollection<T>(collection: string): T[] {
  ensureDataDir();
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf-8");
    return [];
  }
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data) as T[];
}

export function writeCollection<T>(collection: string, data: T[]): void {
  ensureDataDir();
  const filePath = getFilePath(collection);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function findById<T extends { id: string }>(
  collection: string,
  id: string
): T | undefined {
  const items = readCollection<T>(collection);
  return items.find((item) => item.id === id);
}

export function insert<T extends { id: string }>(
  collection: string,
  item: T
): T {
  const items = readCollection<T>(collection);
  items.push(item);
  writeCollection(collection, items);
  return item;
}

export function update<T extends { id: string }>(
  collection: string,
  id: string,
  updates: Partial<T>
): T | undefined {
  const items = readCollection<T>(collection);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return undefined;
  items[index] = { ...items[index], ...updates };
  writeCollection(collection, items);
  return items[index];
}

export function remove<T extends { id: string }>(
  collection: string,
  id: string
): boolean {
  const items = readCollection<T>(collection);
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length === items.length) return false;
  writeCollection(collection, filtered);
  return true;
}
