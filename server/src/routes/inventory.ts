import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';
import { searchPrices } from '../lib/priceSearch';

const router = Router();

// GET /price-search - search for best prices across suppliers
router.get('/price-search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ error: 'Missing search query parameter "q"' });
      return;
    }

    const results = await searchPrices(query);

    const cheapest = results.length > 0 ? results[0].price : null;
    const average =
      results.length > 0
        ? Math.round(
            (results.reduce((s, r) => s + r.price, 0) / results.length) * 100
          ) / 100
        : null;

    res.json({
      query,
      resultCount: results.length,
      cheapestPrice: cheapest,
      averagePrice: average,
      results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to search prices' });
  }
});

// GET /price-search/:id - search prices for a specific inventory item by ID
router.get('/price-search/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: req.params.id },
    });

    if (!item) {
      res.status(404).json({ error: 'Inventory item not found' });
      return;
    }

    const results = await searchPrices(item.name);

    const cheapest = results.length > 0 ? results[0].price : null;
    const savings =
      cheapest !== null ? Math.round((item.unitCost - cheapest) * 100) / 100 : 0;

    res.json({
      item: { id: item.id, name: item.name, currentUnitCost: item.unitCost, supplier: item.supplier },
      query: item.name,
      resultCount: results.length,
      cheapestPrice: cheapest,
      averagePrice:
        results.length > 0
          ? Math.round(
              (results.reduce((s, r) => s + r.price, 0) / results.length) * 100
            ) / 100
          : null,
      potentialSavings: savings,
      results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to search prices for item' });
  }
});

// GET /alerts - return items where currentStock <= minStock (defined before /:id to avoid route conflict)
router.get('/alerts', async (_req: Request, res: Response) => {
  try {
    // Prisma doesn't support field-to-field comparison directly, so fetch and filter
    const allItems = await prisma.inventoryItem.findMany();
    const lowStock = allItems.filter((item) => item.currentStock <= item.minStock);

    res.json(lowStock);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch inventory alerts' });
  }
});

// GET / - list all items
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, lowStock } = req.query;
    const where: Record<string, unknown> = {};
    if (category) where.category = category as string;

    let items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Filter low stock items in-memory (Prisma can't compare two columns)
    if (lowStock === 'true') {
      items = items.filter((item) => item.currentStock <= item.minStock);
    }

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// GET /:id - single item
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: req.params.id },
    });

    if (!item) {
      res.status(404).json({ error: 'Inventory item not found' });
      return;
    }

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

// POST / - create item
router.post('/', async (req: Request, res: Response) => {
  try {
    const item = await prisma.inventoryItem.create({
      data: req.body,
    });

    await logActivity(
      'create_inventory_item',
      'InventoryItem',
      item.id,
      `Inventory item "${item.name}" added with ${item.currentStock} ${item.unit}`,
      { category: item.category, currentStock: item.currentStock }
    );

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// PATCH /:id - update item
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// PATCH /:id/restock - add quantity
router.patch('/:id/restock', async (req: Request, res: Response) => {
  try {
    const { quantity } = req.body;
    const today = new Date().toISOString().split('T')[0];

    if (!quantity || quantity <= 0) {
      res.status(400).json({ error: 'quantity must be a positive number' });
      return;
    }

    const item = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data: {
        currentStock: { increment: quantity },
        lastOrderDate: today,
      },
    });

    await logActivity(
      'restock_inventory',
      'InventoryItem',
      item.id,
      `Restocked "${item.name}" with ${quantity} ${item.unit} (new total: ${item.currentStock})`,
      { quantity, newStock: item.currentStock, lastOrderDate: today }
    );

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to restock inventory item' });
  }
});

export default router;
