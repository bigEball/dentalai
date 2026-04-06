import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';

const router = Router();

// ─── Multer config ─────────────────────────────────────────────────────────

const uploadsDir = path.resolve(__dirname, '../../../data/uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `inventory-import-${uuidv4()}${ext}`);
  },
});

const importUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/heic',
      'text/plain',
      'text/tab-separated-values',
      'application/json',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls|tsv|txt|json|png|jpe?g|webp|heic|pdf)$/i)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not supported: ${file.mimetype}. Upload a spreadsheet, CSV, image, or text file.`));
    }
  },
});

// ─── Supported category values ─────────────────────────────────────────────

const VALID_CATEGORIES = ['restorative', 'preventive', 'surgical', 'orthodontic', 'office', 'ppe'];

function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (/glove|mask|gown|shield|ppe|bib|steriliz/i.test(n)) return 'ppe';
  if (/composite|resin|crown|impression|etch|bond|cement|tray|articulat|curing/i.test(n)) return 'restorative';
  if (/fluoride|prophy|floss|sealant|polish|cavitron|scaler/i.test(n)) return 'preventive';
  if (/suture|scalpel|elevator|forcep|hemostat|surgical|anesthetic/i.test(n)) return 'surgical';
  if (/bracket|wire|band|ortho|aligner/i.test(n)) return 'orthodontic';
  if (/paper|pen|folder|printer|toner|stapl|tape|office/i.test(n)) return 'office';
  return 'restorative';
}

// ─── Parse uploaded file into inventory rows ───────────────────────────────

interface ParsedRow {
  name: string;
  category: string;
  sku: string | null;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  unitCost: number;
  supplier: string | null;
  location: string | null;
}

function normalizeRow(raw: Record<string, unknown>): ParsedRow | null {
  // Find the "name" field — try common column names
  const nameKeys = ['name', 'item', 'product', 'description', 'item name', 'product name', 'item description', 'material'];
  let name = '';
  for (const k of nameKeys) {
    const val = raw[k] ?? raw[k.charAt(0).toUpperCase() + k.slice(1)] ?? raw[k.toUpperCase()];
    if (val && String(val).trim()) {
      name = String(val).trim();
      break;
    }
  }
  // Fallback: use first non-empty string column
  if (!name) {
    for (const v of Object.values(raw)) {
      if (typeof v === 'string' && v.trim().length > 2 && !/^\d+$/.test(v.trim())) {
        name = v.trim();
        break;
      }
    }
  }
  if (!name) return null;

  const findNum = (...keys: string[]): number => {
    for (const k of keys) {
      const val = raw[k] ?? raw[k.charAt(0).toUpperCase() + k.slice(1)] ?? raw[k.toUpperCase()];
      if (val !== undefined && val !== null && val !== '') {
        const n = Number(String(val).replace(/[^0-9.\-]/g, ''));
        if (!isNaN(n)) return n;
      }
    }
    return 0;
  };

  const findStr = (...keys: string[]): string | null => {
    for (const k of keys) {
      const val = raw[k] ?? raw[k.charAt(0).toUpperCase() + k.slice(1)] ?? raw[k.toUpperCase()];
      if (val && String(val).trim()) return String(val).trim();
    }
    return null;
  };

  const catRaw = findStr('category', 'type', 'group') || '';
  const category = VALID_CATEGORIES.includes(catRaw.toLowerCase())
    ? catRaw.toLowerCase()
    : guessCategory(name);

  return {
    name,
    category,
    sku: findStr('sku', 'sku #', 'item #', 'item number', 'product code', 'code', 'part number'),
    currentStock: findNum('quantity', 'qty', 'stock', 'current stock', 'on hand', 'count', 'amount'),
    minStock: findNum('min', 'min stock', 'minimum', 'reorder point', 'reorder level') || 5,
    maxStock: findNum('max', 'max stock', 'maximum', 'par level') || 100,
    unit: findStr('unit', 'uom', 'unit of measure', 'measure') || 'each',
    unitCost: findNum('cost', 'price', 'unit cost', 'unit price', 'price each'),
    supplier: findStr('supplier', 'vendor', 'manufacturer', 'brand', 'source'),
    location: findStr('location', 'loc', 'storage', 'cabinet', 'room'),
  };
}

function parseSpreadsheet(filePath: string): ParsedRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName]!;
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const parsed: ParsedRow[] = [];
  for (const raw of rawRows) {
    const row = normalizeRow(raw);
    if (row) parsed.push(row);
  }
  return parsed;
}

function parseCsv(filePath: string): ParsedRow[] {
  // XLSX can also read CSV files
  const workbook = XLSX.readFile(filePath, { type: 'file' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName]!;
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const parsed: ParsedRow[] = [];
  for (const raw of rawRows) {
    const row = normalizeRow(raw);
    if (row) parsed.push(row);
  }
  return parsed;
}

function parseTextFile(filePath: string): ParsedRow[] {
  const text = fs.readFileSync(filePath, 'utf-8');
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const parsed: ParsedRow[] = [];
  for (const line of lines) {
    // Try tab-separated or comma-separated
    const parts = line.includes('\t') ? line.split('\t') : line.split(',');
    if (parts.length >= 1 && parts[0]!.trim()) {
      const name = parts[0]!.trim();
      if (name.length < 2) continue;
      parsed.push({
        name,
        category: guessCategory(name),
        sku: null,
        currentStock: parts[1] ? parseInt(parts[1], 10) || 0 : 0,
        minStock: 5,
        maxStock: 100,
        unit: parts[2]?.trim() || 'each',
        unitCost: parts[3] ? parseFloat(parts[3]) || 0 : 0,
        supplier: parts[4]?.trim() || null,
        location: null,
      });
    }
  }
  return parsed;
}

function parseJsonFile(filePath: string): ParsedRow[] {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const items: Record<string, unknown>[] = Array.isArray(raw) ? raw : raw.items || raw.inventory || raw.data || [];

  const parsed: ParsedRow[] = [];
  for (const obj of items) {
    const row = normalizeRow(obj);
    if (row) parsed.push(row);
  }
  return parsed;
}

function parseImageToPlaceholder(originalName: string): ParsedRow[] {
  // For images, we return a message that the file was received
  // In production this would go through OCR / vision model
  return [{
    name: `[Imported from image: ${originalName}]`,
    category: 'office',
    sku: null,
    currentStock: 0,
    minStock: 5,
    maxStock: 100,
    unit: 'each',
    unitCost: 0,
    supplier: null,
    location: null,
  }];
}

// ─── Routes ────────────────────────────────────────────────────────────────

// POST /parse — upload file and get parsed preview (don't insert yet)
router.post('/parse', importUpload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    let parsed: ParsedRow[] = [];

    if (ext === '.xlsx' || ext === '.xls' || mime.includes('spreadsheet') || mime.includes('ms-excel')) {
      parsed = parseSpreadsheet(file.path);
    } else if (ext === '.csv' || mime === 'text/csv') {
      parsed = parseCsv(file.path);
    } else if (ext === '.tsv' || mime === 'text/tab-separated-values') {
      parsed = parseCsv(file.path);
    } else if (ext === '.json' || mime === 'application/json') {
      parsed = parseJsonFile(file.path);
    } else if (ext === '.txt' || mime === 'text/plain') {
      parsed = parseTextFile(file.path);
    } else if (mime.startsWith('image/')) {
      parsed = parseImageToPlaceholder(file.originalname);
    } else {
      // Try as text
      parsed = parseTextFile(file.path);
    }

    res.json({
      fileName: file.originalname,
      fileSize: file.size,
      itemCount: parsed.length,
      items: parsed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to parse file' });
  }
});

// POST /confirm — accept parsed items and insert into database
router.post('/confirm', async (req: Request, res: Response) => {
  try {
    const { items } = req.body as { items: ParsedRow[] };
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'No items provided' });
      return;
    }

    const created: Array<{ id: string; name: string }> = [];
    const skipped: string[] = [];

    for (const item of items) {
      if (!item.name || item.name.startsWith('[Imported from image')) {
        skipped.push(item.name || 'unnamed');
        continue;
      }

      // Check for duplicate by name
      const existing = await prisma.inventoryItem.findFirst({
        where: { name: { equals: item.name } },
      });

      if (existing) {
        skipped.push(item.name);
        continue;
      }

      const record = await prisma.inventoryItem.create({
        data: {
          name: item.name,
          category: VALID_CATEGORIES.includes(item.category) ? item.category : 'restorative',
          sku: item.sku || null,
          currentStock: Math.max(0, item.currentStock),
          minStock: Math.max(0, item.minStock),
          maxStock: Math.max(1, item.maxStock),
          unit: item.unit || 'each',
          unitCost: Math.max(0, item.unitCost),
          supplier: item.supplier || null,
          location: item.location || null,
        },
      });

      created.push({ id: record.id, name: record.name });
    }

    if (created.length > 0) {
      await logActivity(
        'import_inventory',
        'InventoryItem',
        created[0]!.id,
        `Imported ${created.length} inventory items from uploaded file`,
        { created: created.length, skipped: skipped.length, itemNames: created.map((c) => c.name) }
      );
    }

    res.json({
      created: created.length,
      skipped: skipped.length,
      skippedNames: skipped,
      items: created,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to import inventory' });
  }
});

export default router;
