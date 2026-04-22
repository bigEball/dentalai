import { Router, Request, Response } from 'express';
import { logActivity } from '../lib/activity';
import {
  predictSupplyNeeds,
  generatePurchaseOrders,
  getPurchaseOrders,
  approvePurchaseOrder,
  getConsumptionAnalysis,
  getWasteReport,
  getExpiryAlerts,
  getProcurementDashboard,
} from '../lib/procurementEngine';

const router = Router();

// GET /predictions — Supply predictions for next N days
router.get('/predictions', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string, 10) || 7;
    const result = await predictSupplyNeeds(days);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate supply predictions' });
  }
});

// GET /purchase-orders — List generated purchase orders
router.get('/purchase-orders', async (_req: Request, res: Response) => {
  try {
    const orders = getPurchaseOrders();
    const totalCost = orders.reduce((sum, o) => sum + o.totalCost, 0);
    res.json({
      orders,
      count: orders.length,
      totalCost: Math.round(totalCost * 100) / 100,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// POST /purchase-orders/generate — Force generate purchase orders
router.post('/purchase-orders/generate', async (_req: Request, res: Response) => {
  try {
    const result = await generatePurchaseOrders();

    await logActivity(
      'generate_purchase_orders',
      'PurchaseOrder',
      'batch',
      `Generated ${result.orders.length} purchase orders for ${result.totalItems} items — total $${result.totalCost.toFixed(2)}`,
      { orderCount: result.orders.length, totalItems: result.totalItems, totalCost: result.totalCost }
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate purchase orders' });
  }
});

// PATCH /purchase-orders/:id/approve — Approve a purchase order
router.patch('/purchase-orders/:id/approve', async (req: Request, res: Response) => {
  try {
    const order = approvePurchaseOrder(req.params.id);

    if (!order) {
      res.status(404).json({ error: 'Purchase order not found' });
      return;
    }

    await logActivity(
      'approve_purchase_order',
      'PurchaseOrder',
      order.id,
      `Approved purchase order for ${order.supplier} — $${order.totalCost.toFixed(2)} (${order.items.length} items)`,
      { supplier: order.supplier, totalCost: order.totalCost, itemCount: order.items.length }
    );

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve purchase order' });
  }
});

// GET /consumption — Consumption analysis
router.get('/consumption', async (_req: Request, res: Response) => {
  try {
    const result = await getConsumptionAnalysis();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch consumption analysis' });
  }
});

// GET /waste — Waste report
router.get('/waste', async (_req: Request, res: Response) => {
  try {
    const result = await getWasteReport();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch waste report' });
  }
});

// GET /expiry-alerts — Expiring items
router.get('/expiry-alerts', async (_req: Request, res: Response) => {
  try {
    const result = await getExpiryAlerts();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expiry alerts' });
  }
});

// GET /dashboard — Dashboard stats
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const result = await getProcurementDashboard();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch inventory management dashboard' });
  }
});

export default router;
