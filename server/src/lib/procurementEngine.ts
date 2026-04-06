import { prisma } from '../db/client';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SupplyRequirement {
  item: string;
  category: string;
  quantity: number;
}

interface PredictedNeed {
  itemName: string;
  category: string;
  currentStock: number;
  predictedNeed: number;
  surplus: number; // positive = surplus, negative = deficit
  unit: string;
  inventoryItemId: string | null;
  matchedByName: boolean;
}

interface PurchaseOrderItem {
  inventoryItemId: string;
  name: string;
  sku: string | null;
  currentStock: number;
  minStock: number;
  maxStock: number;
  orderQuantity: number;
  unitCost: number;
  totalCost: number;
  unit: string;
}

interface PurchaseOrder {
  id: string;
  supplier: string;
  items: PurchaseOrderItem[];
  totalCost: number;
  status: 'draft' | 'approved' | 'ordered' | 'received';
  createdAt: string;
  approvedAt: string | null;
  estimatedDelivery: string | null;
}

interface ConsumptionRecord {
  itemName: string;
  category: string;
  monthlyRate: number;
  weeklyRate: number;
  dailyRate: number;
  currentStock: number;
  daysUntilEmpty: number;
  unit: string;
}

interface WasteItem {
  id: string;
  name: string;
  category: string;
  type: 'expired' | 'expiring_soon' | 'overstocked';
  currentStock: number;
  maxStock: number;
  unit: string;
  unitCost: number;
  costImpact: number;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
}

interface ExpiryAlert {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  unitCost: number;
  expiryDate: string;
  daysUntilExpiry: number;
  urgency: 'critical' | 'warning' | 'notice';
  costAtRisk: number;
}

// ─── Procedure-to-Supply Mapping ────────────────────────────────────────────

const PROCEDURE_SUPPLY_MAP: Record<string, SupplyRequirement[]> = {
  crown_prep: [
    { item: 'Impression Material', category: 'restorative', quantity: 1 },
    { item: 'Temporary Crown Kit', category: 'restorative', quantity: 1 },
    { item: 'Retraction Cord', category: 'restorative', quantity: 2 },
    { item: 'Cement', category: 'restorative', quantity: 0.5 },
    { item: 'Anesthetic Carpules', category: 'surgical', quantity: 2 },
    { item: 'Nitrile Gloves', category: 'ppe', quantity: 4 },
  ],
  extraction: [
    { item: 'Suture Material', category: 'surgical', quantity: 1 },
    { item: 'Gauze Pads', category: 'surgical', quantity: 5 },
    { item: 'Anesthetic Carpules', category: 'surgical', quantity: 3 },
    { item: 'Nitrile Gloves', category: 'ppe', quantity: 4 },
  ],
  filling: [
    { item: 'Composite Resin', category: 'restorative', quantity: 1 },
    { item: 'Bonding Agent', category: 'restorative', quantity: 0.2 },
    { item: 'Etchant', category: 'restorative', quantity: 0.3 },
    { item: 'Anesthetic Carpules', category: 'surgical', quantity: 2 },
    { item: 'Nitrile Gloves', category: 'ppe', quantity: 4 },
  ],
  cleaning: [
    { item: 'Prophy Paste', category: 'preventive', quantity: 1 },
    { item: 'Prophy Angles', category: 'preventive', quantity: 1 },
    { item: 'Fluoride Varnish', category: 'preventive', quantity: 1 },
    { item: 'Nitrile Gloves', category: 'ppe', quantity: 4 },
  ],
  root_canal: [
    { item: 'Endodontic Files', category: 'surgical', quantity: 1 },
    { item: 'Gutta Percha Points', category: 'surgical', quantity: 1 },
    { item: 'Root Canal Sealer', category: 'surgical', quantity: 0.3 },
    { item: 'Anesthetic Carpules', category: 'surgical', quantity: 3 },
    { item: 'Rubber Dam Kit', category: 'surgical', quantity: 1 },
    { item: 'Nitrile Gloves', category: 'ppe', quantity: 4 },
  ],
  implant_placement: [
    { item: 'Implant Fixture', category: 'surgical', quantity: 1 },
    { item: 'Surgical Drill Kit', category: 'surgical', quantity: 0.1 },
    { item: 'Suture Material', category: 'surgical', quantity: 2 },
    { item: 'Gauze Pads', category: 'surgical', quantity: 4 },
    { item: 'Anesthetic Carpules', category: 'surgical', quantity: 3 },
    { item: 'Bone Graft Material', category: 'surgical', quantity: 0.5 },
    { item: 'Nitrile Gloves', category: 'ppe', quantity: 6 },
    { item: 'Sterile Drape', category: 'ppe', quantity: 1 },
  ],
  veneer: [
    { item: 'Impression Material', category: 'restorative', quantity: 1 },
    { item: 'Temporary Veneer Material', category: 'restorative', quantity: 1 },
    { item: 'Etchant', category: 'restorative', quantity: 0.3 },
    { item: 'Bonding Agent', category: 'restorative', quantity: 0.3 },
    { item: 'Cement', category: 'restorative', quantity: 0.3 },
    { item: 'Anesthetic Carpules', category: 'surgical', quantity: 1 },
    { item: 'Nitrile Gloves', category: 'ppe', quantity: 4 },
  ],
  sealant: [
    { item: 'Sealant Material', category: 'preventive', quantity: 1 },
    { item: 'Etchant', category: 'restorative', quantity: 0.2 },
    { item: 'Cotton Rolls', category: 'preventive', quantity: 4 },
    { item: 'Nitrile Gloves', category: 'ppe', quantity: 2 },
  ],
  whitening: [
    { item: 'Whitening Gel', category: 'preventive', quantity: 1 },
    { item: 'Whitening Tray', category: 'preventive', quantity: 1 },
    { item: 'Desensitizing Agent', category: 'preventive', quantity: 1 },
    { item: 'Nitrile Gloves', category: 'ppe', quantity: 2 },
  ],
  denture: [
    { item: 'Impression Material', category: 'restorative', quantity: 2 },
    { item: 'Bite Registration Material', category: 'restorative', quantity: 1 },
    { item: 'Denture Adhesive', category: 'restorative', quantity: 0.5 },
    { item: 'Nitrile Gloves', category: 'ppe', quantity: 4 },
  ],
  periodontal_scaling: [
    { item: 'Ultrasonic Scaler Tips', category: 'surgical', quantity: 1 },
    { item: 'Curette Set', category: 'surgical', quantity: 0.1 },
    { item: 'Anesthetic Carpules', category: 'surgical', quantity: 2 },
    { item: 'Chlorhexidine Rinse', category: 'preventive', quantity: 1 },
    { item: 'Gauze Pads', category: 'surgical', quantity: 3 },
    { item: 'Nitrile Gloves', category: 'ppe', quantity: 4 },
  ],
  bridge: [
    { item: 'Impression Material', category: 'restorative', quantity: 2 },
    { item: 'Temporary Bridge Material', category: 'restorative', quantity: 1 },
    { item: 'Retraction Cord', category: 'restorative', quantity: 3 },
    { item: 'Cement', category: 'restorative', quantity: 1 },
    { item: 'Anesthetic Carpules', category: 'surgical', quantity: 3 },
    { item: 'Nitrile Gloves', category: 'ppe', quantity: 6 },
  ],
};

// Normalize appointment type strings to match our mapping keys
function normalizeType(type: string): string {
  const normalized = type.toLowerCase().replace(/[\s-]+/g, '_');
  // Map common variations
  const aliases: Record<string, string> = {
    crown: 'crown_prep',
    crown_preparation: 'crown_prep',
    composite: 'filling',
    composite_filling: 'filling',
    amalgam: 'filling',
    hygiene: 'cleaning',
    prophylaxis: 'cleaning',
    prophy: 'cleaning',
    checkup: 'cleaning',
    exam: 'cleaning',
    rct: 'root_canal',
    endo: 'root_canal',
    endodontic: 'root_canal',
    implant: 'implant_placement',
    surgical_extraction: 'extraction',
    simple_extraction: 'extraction',
    wisdom_tooth: 'extraction',
    srp: 'periodontal_scaling',
    scaling: 'periodontal_scaling',
    deep_cleaning: 'periodontal_scaling',
    teeth_whitening: 'whitening',
    bleaching: 'whitening',
    dental_sealant: 'sealant',
    porcelain_veneer: 'veneer',
    dental_bridge: 'bridge',
    partial_denture: 'denture',
    full_denture: 'denture',
  };

  return aliases[normalized] || normalized;
}

// ─── In-Memory Purchase Order Store ─────────────────────────────────────────

const purchaseOrders: Map<string, PurchaseOrder> = new Map();

// ─── Helper: match supply name to inventory items ───────────────────────────

function findInventoryMatch(
  items: { id: string; name: string; category: string; currentStock: number; unit: string }[],
  supplyName: string,
): typeof items[number] | null {
  const lowerName = supplyName.toLowerCase();
  return (
    items.find((i) => i.name.toLowerCase() === lowerName) ||
    items.find((i) => i.name.toLowerCase().includes(lowerName)) ||
    items.find((i) => lowerName.includes(i.name.toLowerCase())) ||
    null
  );
}

// ─── Exported Functions ─────────────────────────────────────────────────────

/**
 * Predict supply needs based on scheduled procedures for the next N days.
 */
export async function predictSupplyNeeds(days: number = 7): Promise<{
  predictions: PredictedNeed[];
  totalProcedures: number;
  periodDays: number;
  deficitCount: number;
}> {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);

  const todayStr = today.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  // Fetch upcoming appointments
  const appointments = await prisma.appointment.findMany({
    where: {
      date: { gte: todayStr, lte: endStr },
      status: { in: ['scheduled', 'confirmed'] },
    },
  });

  // Aggregate supply needs from all procedures
  const supplyAggregation: Map<string, { category: string; totalQty: number }> = new Map();

  for (const appt of appointments) {
    const procType = normalizeType(appt.type);
    const supplies = PROCEDURE_SUPPLY_MAP[procType];
    if (!supplies) continue;

    for (const supply of supplies) {
      const existing = supplyAggregation.get(supply.item);
      if (existing) {
        existing.totalQty += supply.quantity;
      } else {
        supplyAggregation.set(supply.item, {
          category: supply.category,
          totalQty: supply.quantity,
        });
      }
    }
  }

  // Get all inventory items for matching
  const inventoryItems = await prisma.inventoryItem.findMany();

  const predictions: PredictedNeed[] = [];

  for (const [itemName, need] of supplyAggregation.entries()) {
    const roundedNeed = Math.ceil(need.totalQty);
    const match = findInventoryMatch(inventoryItems, itemName);

    predictions.push({
      itemName,
      category: need.category,
      currentStock: match ? match.currentStock : 0,
      predictedNeed: roundedNeed,
      surplus: (match ? match.currentStock : 0) - roundedNeed,
      unit: match ? match.unit : 'units',
      inventoryItemId: match ? match.id : null,
      matchedByName: !!match,
    });
  }

  // Sort: deficits first, then by magnitude
  predictions.sort((a, b) => a.surplus - b.surplus);

  const deficitCount = predictions.filter((p) => p.surplus < 0).length;

  return {
    predictions,
    totalProcedures: appointments.length,
    periodDays: days,
    deficitCount,
  };
}

/**
 * Auto-generate purchase orders for items at/below reorder point.
 * Order quantity = maxStock - currentStock. Grouped by supplier.
 */
export async function generatePurchaseOrders(): Promise<{
  orders: PurchaseOrder[];
  totalItems: number;
  totalCost: number;
}> {
  const allItems = await prisma.inventoryItem.findMany();

  // Find items at or below minStock
  const lowStockItems = allItems.filter((item) => item.currentStock <= item.minStock);

  // Group by supplier
  const supplierGroups: Map<string, typeof lowStockItems> = new Map();
  for (const item of lowStockItems) {
    const supplier = item.supplier || 'Unknown Supplier';
    const group = supplierGroups.get(supplier) || [];
    group.push(item);
    supplierGroups.set(supplier, group);
  }

  const newOrders: PurchaseOrder[] = [];
  let totalItems = 0;
  let totalCost = 0;

  for (const [supplier, items] of supplierGroups.entries()) {
    const orderItems: PurchaseOrderItem[] = items.map((item) => {
      const orderQty = item.maxStock - item.currentStock;
      const itemTotal = orderQty * item.unitCost;
      totalItems++;
      return {
        inventoryItemId: item.id,
        name: item.name,
        sku: item.sku,
        currentStock: item.currentStock,
        minStock: item.minStock,
        maxStock: item.maxStock,
        orderQuantity: orderQty,
        unitCost: item.unitCost,
        totalCost: Math.round(itemTotal * 100) / 100,
        unit: item.unit,
      };
    });

    const orderTotal = orderItems.reduce((sum, i) => sum + i.totalCost, 0);
    totalCost += orderTotal;

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);

    const order: PurchaseOrder = {
      id: uuidv4(),
      supplier,
      items: orderItems,
      totalCost: Math.round(orderTotal * 100) / 100,
      status: 'draft',
      createdAt: new Date().toISOString(),
      approvedAt: null,
      estimatedDelivery: deliveryDate.toISOString().split('T')[0],
    };

    purchaseOrders.set(order.id, order);
    newOrders.push(order);
  }

  return {
    orders: newOrders,
    totalItems,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}

/**
 * Get all stored purchase orders.
 */
export function getPurchaseOrders(): PurchaseOrder[] {
  return Array.from(purchaseOrders.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Approve a purchase order by ID.
 */
export function approvePurchaseOrder(id: string): PurchaseOrder | null {
  const order = purchaseOrders.get(id);
  if (!order) return null;

  const updatedOrder: PurchaseOrder = {
    ...order,
    status: 'approved',
    approvedAt: new Date().toISOString(),
  };
  purchaseOrders.set(id, updatedOrder);
  return updatedOrder;
}

/**
 * Track consumption patterns over time based on appointment volume.
 */
export async function getConsumptionAnalysis(): Promise<{
  items: ConsumptionRecord[];
  monthlyTrends: { month: string; items: { name: string; consumption: number }[] }[];
}> {
  // Estimate monthly consumption based on the last 30 days of appointments
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const recentAppointments = await prisma.appointment.findMany({
    where: {
      date: { gte: thirtyDaysAgoStr },
      status: { in: ['completed', 'scheduled', 'confirmed'] },
    },
  });

  // Aggregate consumption from recent appointments
  const consumptionMap: Map<string, { category: string; totalQty: number }> = new Map();

  for (const appt of recentAppointments) {
    const procType = normalizeType(appt.type);
    const supplies = PROCEDURE_SUPPLY_MAP[procType];
    if (!supplies) continue;

    for (const supply of supplies) {
      const existing = consumptionMap.get(supply.item);
      if (existing) {
        existing.totalQty += supply.quantity;
      } else {
        consumptionMap.set(supply.item, {
          category: supply.category,
          totalQty: supply.quantity,
        });
      }
    }
  }

  const inventoryItems = await prisma.inventoryItem.findMany();

  const items: ConsumptionRecord[] = [];

  for (const [itemName, data] of consumptionMap.entries()) {
    const match = findInventoryMatch(inventoryItems, itemName);
    const monthlyRate = Math.round(data.totalQty * 100) / 100;
    const dailyRate = Math.round((monthlyRate / 30) * 100) / 100;
    const weeklyRate = Math.round(dailyRate * 7 * 100) / 100;
    const currentStock = match ? match.currentStock : 0;
    const daysUntilEmpty = dailyRate > 0 ? Math.floor(currentStock / dailyRate) : 999;

    items.push({
      itemName,
      category: data.category,
      monthlyRate,
      weeklyRate,
      dailyRate,
      currentStock,
      daysUntilEmpty,
      unit: match ? match.unit : 'units',
    });
  }

  items.sort((a, b) => b.monthlyRate - a.monthlyRate);

  // Generate 6-month trend data (simulated historical using current rate with variance)
  const monthlyTrends: { month: string; items: { name: string; consumption: number }[] }[] = [];
  const topItems = items.slice(0, 5);
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const trendDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = trendDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const monthItems = topItems.map((item) => {
      // Simulate variance: +/- 20% around the monthly rate
      const variance = 0.8 + Math.random() * 0.4;
      return {
        name: item.itemName,
        consumption: Math.round(item.monthlyRate * variance * 100) / 100,
      };
    });

    monthlyTrends.push({ month: monthLabel, items: monthItems });
  }

  return { items, monthlyTrends };
}

/**
 * Identify waste: expired items, items expiring soon, overstocked items.
 */
export async function getWasteReport(): Promise<{
  wasteItems: WasteItem[];
  totalWasteCost: number;
  expiredCount: number;
  overstockedCount: number;
  expiringCount: number;
}> {
  const allItems = await prisma.inventoryItem.findMany();
  const today = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  const wasteItems: WasteItem[] = [];

  for (const item of allItems) {
    // Check for expired items
    if (item.expiryDate) {
      const expiry = new Date(item.expiryDate);
      const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil <= 0) {
        wasteItems.push({
          id: item.id,
          name: item.name,
          category: item.category,
          type: 'expired',
          currentStock: item.currentStock,
          maxStock: item.maxStock,
          unit: item.unit,
          unitCost: item.unitCost,
          costImpact: Math.round(item.currentStock * item.unitCost * 100) / 100,
          expiryDate: item.expiryDate,
          daysUntilExpiry: daysUntil,
        });
      } else if (daysUntil <= 90) {
        wasteItems.push({
          id: item.id,
          name: item.name,
          category: item.category,
          type: 'expiring_soon',
          currentStock: item.currentStock,
          maxStock: item.maxStock,
          unit: item.unit,
          unitCost: item.unitCost,
          costImpact: Math.round(item.currentStock * item.unitCost * 100) / 100,
          expiryDate: item.expiryDate,
          daysUntilExpiry: daysUntil,
        });
      }
    }

    // Check for overstocked items
    if (item.currentStock > item.maxStock * 1.5) {
      const excessQty = item.currentStock - item.maxStock;
      wasteItems.push({
        id: item.id,
        name: item.name,
        category: item.category,
        type: 'overstocked',
        currentStock: item.currentStock,
        maxStock: item.maxStock,
        unit: item.unit,
        unitCost: item.unitCost,
        costImpact: Math.round(excessQty * item.unitCost * 100) / 100,
        expiryDate: item.expiryDate,
        daysUntilExpiry: null,
      });
    }
  }

  // Sort by cost impact descending
  wasteItems.sort((a, b) => b.costImpact - a.costImpact);

  const expiredCount = wasteItems.filter((w) => w.type === 'expired').length;
  const overstockedCount = wasteItems.filter((w) => w.type === 'overstocked').length;
  const expiringCount = wasteItems.filter((w) => w.type === 'expiring_soon').length;
  const totalWasteCost = wasteItems.reduce((sum, w) => sum + w.costImpact, 0);

  return {
    wasteItems,
    totalWasteCost: Math.round(totalWasteCost * 100) / 100,
    expiredCount,
    overstockedCount,
    expiringCount,
  };
}

/**
 * Items expiring within 30/60/90 days.
 */
export async function getExpiryAlerts(): Promise<{
  alerts: ExpiryAlert[];
  critical: number;
  warning: number;
  notice: number;
  totalCostAtRisk: number;
}> {
  const allItems = await prisma.inventoryItem.findMany({
    where: { expiryDate: { not: null } },
  });

  const today = new Date();
  const alerts: ExpiryAlert[] = [];

  for (const item of allItems) {
    if (!item.expiryDate) continue;

    const expiry = new Date(item.expiryDate);
    const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil > 90) continue;

    let urgency: 'critical' | 'warning' | 'notice';
    if (daysUntil <= 30) {
      urgency = 'critical';
    } else if (daysUntil <= 60) {
      urgency = 'warning';
    } else {
      urgency = 'notice';
    }

    alerts.push({
      id: item.id,
      name: item.name,
      category: item.category,
      currentStock: item.currentStock,
      unit: item.unit,
      unitCost: item.unitCost,
      expiryDate: item.expiryDate,
      daysUntilExpiry: daysUntil,
      urgency,
      costAtRisk: Math.round(item.currentStock * item.unitCost * 100) / 100,
    });
  }

  // Sort by days until expiry ascending (most urgent first)
  alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  const critical = alerts.filter((a) => a.urgency === 'critical').length;
  const warning = alerts.filter((a) => a.urgency === 'warning').length;
  const notice = alerts.filter((a) => a.urgency === 'notice').length;
  const totalCostAtRisk = alerts.reduce((sum, a) => sum + a.costAtRisk, 0);

  return {
    alerts,
    critical,
    warning,
    notice,
    totalCostAtRisk: Math.round(totalCostAtRisk * 100) / 100,
  };
}

/**
 * Procurement dashboard stats.
 */
export async function getProcurementDashboard(): Promise<{
  itemsBelowReorder: number;
  expiringSoon30: number;
  pendingOrdersValue: number;
  projectedSavings: number;
  totalInventoryValue: number;
  totalItems: number;
  categoryCounts: Record<string, number>;
  topConsumers: { name: string; monthlyRate: number }[];
  recentOrders: PurchaseOrder[];
}> {
  const allItems = await prisma.inventoryItem.findMany();
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Items below reorder point
  const itemsBelowReorder = allItems.filter((item) => item.currentStock <= item.minStock).length;

  // Expiring within 30 days
  const expiringSoon30 = allItems.filter((item) => {
    if (!item.expiryDate) return false;
    const expiry = new Date(item.expiryDate);
    const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 30;
  }).length;

  // Pending orders value
  const allOrders = getPurchaseOrders();
  const pendingOrders = allOrders.filter((o) => o.status === 'draft' || o.status === 'approved');
  const pendingOrdersValue = pendingOrders.reduce((sum, o) => sum + o.totalCost, 0);

  // Projected savings: estimate 8% savings from bulk ordering for items needing reorder
  const reorderItems = allItems.filter((item) => item.currentStock <= item.minStock);
  const reorderValue = reorderItems.reduce(
    (sum, item) => sum + (item.maxStock - item.currentStock) * item.unitCost,
    0
  );
  const projectedSavings = Math.round(reorderValue * 0.08 * 100) / 100;

  // Total inventory value
  const totalInventoryValue = allItems.reduce(
    (sum, item) => sum + item.currentStock * item.unitCost,
    0
  );

  // Category counts
  const categoryCounts: Record<string, number> = {};
  for (const item of allItems) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  }

  // Get consumption for top consumers
  const consumption = await getConsumptionAnalysis();
  const topConsumers = consumption.items.slice(0, 5).map((c) => ({
    name: c.itemName,
    monthlyRate: c.monthlyRate,
  }));

  // Recent orders
  const recentOrders = allOrders.slice(0, 5);

  return {
    itemsBelowReorder,
    expiringSoon30,
    pendingOrdersValue: Math.round(pendingOrdersValue * 100) / 100,
    projectedSavings,
    totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
    totalItems: allItems.length,
    categoryCounts,
    topConsumers,
    recentOrders,
  };
}
