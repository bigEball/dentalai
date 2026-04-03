import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';

const router = Router();

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
