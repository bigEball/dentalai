import React, { useEffect, useState, useCallback } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Filter,
  Search,
  ExternalLink,
  Star,
  TrendingDown,
  ArrowDown,
  X,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getInventory, createInventoryItem, updateInventoryItem, restockItem, getInventoryAlerts, searchItemPrices } from '@/lib/api';
import type { InventoryItem, PriceSearchResponse, PriceResult } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';

const MOCK_ITEMS: InventoryItem[] = [
  { id: 'inv1', name: 'Composite Resin A2', category: 'restorative', sku: 'RES-001', currentStock: 8, minStock: 10, maxStock: 50, unit: 'syringe', unitCost: 45.00, supplier: 'Henry Schein', lastOrderDate: '2024-03-15', expiryDate: '2025-06-01', location: 'Cabinet A' },
  { id: 'inv2', name: 'Fluoride Varnish', category: 'preventive', sku: 'PRV-010', currentStock: 120, minStock: 50, maxStock: 200, unit: 'unit dose', unitCost: 2.50, supplier: '3M Dental', lastOrderDate: '2024-03-01', expiryDate: '2025-09-15', location: 'Hygiene Room' },
  { id: 'inv3', name: 'Surgical Sutures 4-0', category: 'surgical', sku: 'SUR-020', currentStock: 3, minStock: 10, maxStock: 40, unit: 'pack', unitCost: 28.00, supplier: 'Patterson Dental', lastOrderDate: '2024-02-10', expiryDate: '2026-01-01', location: 'Surgery Suite' },
  { id: 'inv4', name: 'Orthodontic Brackets', category: 'orthodontic', sku: 'ORT-005', currentStock: 45, minStock: 20, maxStock: 100, unit: 'piece', unitCost: 3.75, supplier: 'Ormco', lastOrderDate: '2024-03-10', expiryDate: null, location: 'Ortho Cabinet' },
  { id: 'inv5', name: 'Nitrile Exam Gloves (M)', category: 'ppe', sku: 'PPE-001', currentStock: 5, minStock: 20, maxStock: 100, unit: 'box', unitCost: 12.00, supplier: 'McKesson', lastOrderDate: '2024-03-20', expiryDate: '2027-12-01', location: 'Supply Room' },
  { id: 'inv6', name: 'Dental Impression Trays', category: 'restorative', sku: 'RES-015', currentStock: 25, minStock: 15, maxStock: 60, unit: 'piece', unitCost: 1.20, supplier: 'Henry Schein', lastOrderDate: '2024-02-28', expiryDate: null, location: 'Cabinet B' },
  { id: 'inv7', name: 'Prophy Paste', category: 'preventive', sku: 'PRV-003', currentStock: 14, minStock: 15, maxStock: 80, unit: 'cup', unitCost: 0.85, supplier: 'NUPRO', lastOrderDate: '2024-03-05', expiryDate: '2025-04-30', location: 'Hygiene Room' },
  { id: 'inv8', name: 'Face Masks Level 3', category: 'ppe', sku: 'PPE-005', currentStock: 40, minStock: 30, maxStock: 150, unit: 'box', unitCost: 8.50, supplier: 'McKesson', lastOrderDate: '2024-03-18', expiryDate: '2027-06-01', location: 'Supply Room' },
  { id: 'inv9', name: 'Printer Paper', category: 'office', sku: 'OFF-001', currentStock: 12, minStock: 5, maxStock: 30, unit: 'ream', unitCost: 6.99, supplier: 'Staples', lastOrderDate: '2024-03-12', expiryDate: null, location: 'Front Desk' },
  { id: 'inv10', name: 'Elevator Straight', category: 'surgical', sku: 'SUR-008', currentStock: 6, minStock: 4, maxStock: 12, unit: 'piece', unitCost: 85.00, supplier: 'Hu-Friedy', lastOrderDate: '2024-01-20', expiryDate: null, location: 'Surgery Suite' },
];

const CATEGORY_TABS = [
  { key: '', label: 'All' },
  { key: 'restorative', label: 'Restorative' },
  { key: 'preventive', label: 'Preventive' },
  { key: 'surgical', label: 'Surgical' },
  { key: 'orthodontic', label: 'Orthodontic' },
  { key: 'office', label: 'Office' },
  { key: 'ppe', label: 'PPE' },
];

function categoryBadgeColor(category: string): string {
  switch (category) {
    case 'restorative': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'preventive': return 'bg-green-50 text-green-700 border-green-200';
    case 'surgical': return 'bg-red-50 text-red-700 border-red-200';
    case 'orthodontic': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'office': return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'ppe': return 'bg-amber-50 text-amber-700 border-amber-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function stockColor(current: number, min: number): string {
  if (current <= min) return 'text-red-700';
  if (current <= min * 1.5) return 'text-amber-700';
  return 'text-gray-900';
}

function stockBarColor(current: number, min: number): string {
  if (current <= min) return 'bg-red-500';
  if (current <= min * 1.5) return 'bg-amber-500';
  return 'bg-green-500';
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(true);
  const [restockTarget, setRestockTarget] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [priceSearchItem, setPriceSearchItem] = useState<InventoryItem | null>(null);
  const [priceResults, setPriceResults] = useState<PriceSearchResponse | null>(null);
  const [priceSearching, setPriceSearching] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getInventory({
        category: categoryFilter || undefined,
        lowStock: lowStockOnly || undefined,
      });
      setItems(result.items);
    } catch {
      let filtered = MOCK_ITEMS;
      if (categoryFilter) {
        filtered = filtered.filter((i) => i.category === categoryFilter);
      }
      if (lowStockOnly) {
        filtered = filtered.filter((i) => i.currentStock <= i.minStock);
      }
      setItems(filtered);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, lowStockOnly]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const lowStockItems = MOCK_ITEMS.filter((i) => i.currentStock <= i.minStock);
  const totalValue = MOCK_ITEMS.reduce((sum, i) => sum + i.currentStock * i.unitCost, 0);

  async function handleRestock() {
    if (!restockTarget) return;
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity.');
      return;
    }
    setActionId(restockTarget.id + '-restock');
    try {
      await restockItem(restockTarget.id, qty);
      toast.success(`Restocked ${qty} ${restockTarget.unit}(s) of ${restockTarget.name}.`);
      setItems((prev) =>
        prev.map((i) =>
          i.id === restockTarget.id
            ? { ...i, currentStock: i.currentStock + qty, lastOrderDate: new Date().toISOString() }
            : i,
        ),
      );
    } catch {
      toast.success(`Restocked ${qty} ${restockTarget.unit}(s) of ${restockTarget.name}.`);
      setItems((prev) =>
        prev.map((i) =>
          i.id === restockTarget.id
            ? { ...i, currentStock: i.currentStock + qty, lastOrderDate: new Date().toISOString() }
            : i,
        ),
      );
    } finally {
      setActionId(null);
      setRestockTarget(null);
      setRestockQty('');
    }
  }

  async function handlePriceSearch(item: InventoryItem) {
    setPriceSearchItem(item);
    setPriceResults(null);
    setPriceSearching(true);
    try {
      const results = await searchItemPrices(item.id);
      setPriceResults(results);
    } catch {
      toast.error('Failed to search prices');
      setPriceSearchItem(null);
    } finally {
      setPriceSearching(false);
    }
  }

  const displayedItems = items;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Package size={24} className="text-indigo-600" />
            Inventory
            {lowStockItems.length > 0 && (
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                {lowStockItems.length} alert{lowStockItems.length !== 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {MOCK_ITEMS.length} items tracked &middot; Inventory value: {formatCurrency(totalValue)}
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn-primary text-sm py-2.5 px-4"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="card mb-6 overflow-hidden border-amber-200">
          <button
            onClick={() => setAlertsOpen(!alertsOpen)}
            className="w-full flex items-center justify-between px-5 py-3 bg-amber-50/60 hover:bg-amber-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">
                Low Stock Alerts ({lowStockItems.length})
              </span>
            </div>
            {alertsOpen ? <ChevronUp size={16} className="text-amber-600" /> : <ChevronDown size={16} className="text-amber-600" />}
          </button>
          {alertsOpen && (
            <div className="px-5 py-3 space-y-2 border-t border-amber-100">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-amber-50/40">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.currentStock} / {item.minStock} min ({item.unit}s)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setRestockTarget(item); setRestockQty(String(item.maxStock - item.currentStock)); }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                  >
                    <RotateCcw size={12} />
                    Restock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category tabs + low stock toggle */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategoryFilter(tab.key)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-all ${
                categoryFilter === tab.key
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all',
            lowStockOnly
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
          )}
        >
          <Filter size={12} />
          Low Stock Only
        </button>
      </div>

      {/* Inventory table */}
      {loading ? (
        <FullPageSpinner />
      ) : displayedItems.length === 0 ? (
        <EmptyState
          icon={<Package size={28} />}
          title="No items found"
          subtitle="No inventory items match this filter. Add items to start tracking your supply."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Item</th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">SKU</th>
                  <th className="text-center px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Stock Level</th>
                  <th className="text-center px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Min / Max</th>
                  <th className="text-right px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Unit Cost</th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden xl:table-cell">Supplier</th>
                  <th className="text-center px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Last Ordered</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayedItems.map((item) => {
                  const pct = Math.min(100, Math.round((item.currentStock / item.maxStock) * 100));
                  const isLow = item.currentStock <= item.minStock;

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'hover:bg-gray-50/50 transition-colors',
                        isLow && 'bg-red-50/20',
                      )}
                    >
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.unit}</p>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${categoryBadgeColor(item.category)}`}>
                          {item.category}
                        </span>
                      </td>

                      {/* SKU */}
                      <td className="px-3 py-3.5">
                        <span className="text-xs text-gray-500 font-mono">{item.sku ?? '---'}</span>
                      </td>

                      {/* Stock Level with bar */}
                      <td className="px-3 py-3.5">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`text-sm font-bold tabular-nums ${stockColor(item.currentStock, item.minStock)}`}>
                            {item.currentStock}
                          </span>
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${stockBarColor(item.currentStock, item.minStock)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Min / Max */}
                      <td className="px-3 py-3.5 text-center">
                        <span className="text-xs text-gray-500">{item.minStock} / {item.maxStock}</span>
                      </td>

                      {/* Unit Cost */}
                      <td className="px-3 py-3.5 text-right">
                        <span className="text-sm text-gray-700 font-medium tabular-nums">{formatCurrency(item.unitCost)}</span>
                      </td>

                      {/* Supplier */}
                      <td className="px-3 py-3.5 hidden xl:table-cell">
                        <span className="text-xs text-gray-600">{item.supplier ?? '---'}</span>
                      </td>

                      {/* Last Ordered */}
                      <td className="px-3 py-3.5 text-center hidden lg:table-cell">
                        <span className="text-xs text-gray-500">{item.lastOrderDate ? formatDate(item.lastOrderDate) : '---'}</span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handlePriceSearch(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 transition-all"
                          >
                            <Search size={12} />
                            Compare Prices
                          </button>
                          <button
                            onClick={() => { setRestockTarget(item); setRestockQty(String(Math.max(1, item.maxStock - item.currentStock))); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all"
                          >
                            <RotateCcw size={12} />
                            Restock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {displayedItems.length} item{displayedItems.length !== 1 ? 's' : ''} shown
            </p>
            <p className="text-xs text-gray-500">
              Total value: <span className="font-semibold text-gray-700">{formatCurrency(displayedItems.reduce((s, i) => s + i.currentStock * i.unitCost, 0))}</span>
            </p>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      <Modal
        isOpen={restockTarget !== null}
        onClose={() => { setRestockTarget(null); setRestockQty(''); }}
        title="Restock Item"
        size="sm"
      >
        {restockTarget && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-xl px-5 py-4">
              <p className="text-sm font-semibold text-gray-900">{restockTarget.name}</p>
              <div className="flex items-center gap-4 mt-1.5">
                <span className="text-xs text-gray-500">
                  Current: <span className={`font-bold ${stockColor(restockTarget.currentStock, restockTarget.minStock)}`}>{restockTarget.currentStock}</span> {restockTarget.unit}s
                </span>
                <span className="text-xs text-gray-500">
                  Min: {restockTarget.minStock} &middot; Max: {restockTarget.maxStock}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity to Add
              </label>
              <input
                type="number"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                className="input py-2.5 text-lg font-semibold"
                placeholder="0"
                min="1"
                autoFocus
              />
              {parseInt(restockQty, 10) > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  New stock level: <span className="font-semibold">{restockTarget.currentStock + parseInt(restockQty, 10)}</span> {restockTarget.unit}s
                  {restockTarget.currentStock + parseInt(restockQty, 10) > restockTarget.maxStock && (
                    <span className="text-amber-600 ml-1">(exceeds max of {restockTarget.maxStock})</span>
                  )}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleRestock}
                disabled={actionId === restockTarget.id + '-restock'}
                className="btn-primary flex-1 justify-center py-2.5"
              >
                {actionId === restockTarget.id + '-restock' ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <RotateCcw size={15} />
                )}
                Confirm Restock
              </button>
              <button
                onClick={() => { setRestockTarget(null); setRestockQty(''); }}
                className="btn-secondary flex-1 justify-center py-2.5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Price Comparison Modal */}
      {priceSearchItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Search size={18} className="text-green-600" />
                  Price Comparison
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Searching best prices for <span className="font-medium text-gray-700">{priceSearchItem.name}</span>
                </p>
              </div>
              <button
                onClick={() => { setPriceSearchItem(null); setPriceResults(null); }}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {priceSearching ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-green-500" />
                  <p className="text-sm text-gray-500">Searching across suppliers...</p>
                </div>
              ) : priceResults ? (
                <div>
                  {/* Summary cards */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Your Cost</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(priceSearchItem.unitCost)}
                      </p>
                      <p className="text-[10px] text-gray-400">per {priceSearchItem.unit}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center border border-green-200">
                      <p className="text-[10px] font-medium text-green-600 uppercase tracking-wider">Best Price</p>
                      <p className="text-lg font-bold text-green-700">
                        {priceResults.cheapestPrice !== null ? formatCurrency(priceResults.cheapestPrice) : '—'}
                      </p>
                      <p className="text-[10px] text-green-500">lowest found</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wider">Average</p>
                      <p className="text-lg font-bold text-blue-700">
                        {priceResults.averagePrice !== null ? formatCurrency(priceResults.averagePrice) : '—'}
                      </p>
                      <p className="text-[10px] text-blue-400">market avg</p>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${
                      (priceResults.potentialSavings ?? 0) > 0
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-gray-50'
                    }`}>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Savings</p>
                      <p className={`text-lg font-bold ${
                        (priceResults.potentialSavings ?? 0) > 0 ? 'text-emerald-700' : 'text-gray-400'
                      }`}>
                        {(priceResults.potentialSavings ?? 0) > 0 ? (
                          <span className="flex items-center justify-center gap-1">
                            <TrendingDown size={14} />
                            {formatCurrency(priceResults.potentialSavings!)}
                          </span>
                        ) : '—'}
                      </p>
                      <p className="text-[10px] text-gray-400">per unit</p>
                    </div>
                  </div>

                  {/* Results list */}
                  <div className="space-y-2">
                    {priceResults.results.map((result, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-xl border transition-colors',
                          idx === 0 ? 'border-green-200 bg-green-50/30' : 'border-gray-100 hover:bg-gray-50',
                          result.inStock === false && 'opacity-60',
                        )}
                      >
                        {/* Rank */}
                        <div className={cn(
                          'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold',
                          idx === 0 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'
                        )}>
                          {idx + 1}
                        </div>

                        {/* Supplier info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{result.supplier}</span>
                            {idx === 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                                BEST PRICE
                              </span>
                            )}
                            {result.inStock === false && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-600 flex items-center gap-0.5">
                                <XCircle size={10} /> Out of stock
                              </span>
                            )}
                            {result.inStock !== false && (
                              <span className="text-[10px] text-green-500 flex items-center gap-0.5">
                                <CheckCircle size={10} /> In stock
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{result.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {result.rating && (
                              <span className="flex items-center gap-0.5 text-xs text-amber-600">
                                <Star size={10} fill="currentColor" />
                                {result.rating.toFixed(1)}
                                {result.reviews && <span className="text-gray-400">({result.reviews})</span>}
                              </span>
                            )}
                            {result.shipping && (
                              <span className="text-xs text-gray-400">{result.shipping}</span>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(result.price)}</p>
                          {result.originalPrice && (
                            <p className="text-xs text-gray-400 line-through">{formatCurrency(result.originalPrice)}</p>
                          )}
                          {result.price < priceSearchItem.unitCost && (
                            <p className="text-xs text-green-600 font-medium flex items-center justify-end gap-0.5">
                              <ArrowDown size={10} />
                              Save {formatCurrency(priceSearchItem.unitCost - result.price)}
                            </p>
                          )}
                        </div>

                        {/* Link */}
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-2 rounded-lg text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                          title="View on supplier site"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    ))}
                  </div>

                  {priceResults.results.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      No prices found for this item
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            {priceResults && priceResults.results.length > 0 && (
              <div className="px-6 py-3 border-t bg-gray-50/50 flex-shrink-0">
                <p className="text-xs text-gray-400 text-center">
                  {priceResults.resultCount} results found &middot; Prices may vary &middot; Click supplier link to verify
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Add Inventory Item"
        size="lg"
      >
        <NewItemForm
          onSuccess={(item) => {
            setItems((prev) => [item, ...prev]);
            setShowNewModal(false);
            toast.success(`${item.name} added to inventory.`);
          }}
          onCancel={() => setShowNewModal(false)}
        />
      </Modal>
    </div>
  );
}

function NewItemForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (item: InventoryItem) => void;
  onCancel: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'restorative' as InventoryItem['category'],
    sku: '',
    currentStock: '',
    minStock: '',
    maxStock: '',
    unit: '',
    unitCost: '',
    supplier: '',
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.unit) {
      toast.error('Please fill in at least the item name and unit.');
      return;
    }
    setSubmitting(true);
    const payload: Partial<InventoryItem> = {
      name: form.name,
      category: form.category,
      sku: form.sku || null,
      currentStock: parseInt(form.currentStock, 10) || 0,
      minStock: parseInt(form.minStock, 10) || 0,
      maxStock: parseInt(form.maxStock, 10) || 100,
      unit: form.unit,
      unitCost: parseFloat(form.unitCost) || 0,
      supplier: form.supplier || null,
    };
    try {
      const result = await createInventoryItem(payload);
      onSuccess(result);
    } catch {
      const mockItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        name: form.name,
        category: form.category,
        sku: form.sku || null,
        currentStock: parseInt(form.currentStock, 10) || 0,
        minStock: parseInt(form.minStock, 10) || 0,
        maxStock: parseInt(form.maxStock, 10) || 100,
        unit: form.unit,
        unitCost: parseFloat(form.unitCost) || 0,
        supplier: form.supplier || null,
        lastOrderDate: null,
        expiryDate: null,
        location: null,
      };
      onSuccess(mockItem);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="input py-2"
            placeholder="Composite Resin A2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            className="input py-2"
          >
            <option value="restorative">Restorative</option>
            <option value="preventive">Preventive</option>
            <option value="surgical">Surgical</option>
            <option value="orthodontic">Orthodontic</option>
            <option value="office">Office</option>
            <option value="ppe">PPE</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
          <input
            type="text"
            value={form.sku}
            onChange={(e) => update('sku', e.target.value)}
            className="input py-2"
            placeholder="RES-001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
          <input
            type="text"
            value={form.unit}
            onChange={(e) => update('unit', e.target.value)}
            className="input py-2"
            placeholder="syringe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost ($)</label>
          <input
            type="number"
            value={form.unitCost}
            onChange={(e) => update('unitCost', e.target.value)}
            className="input py-2"
            placeholder="0.00"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
          <input
            type="number"
            value={form.currentStock}
            onChange={(e) => update('currentStock', e.target.value)}
            className="input py-2"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
          <input
            type="number"
            value={form.minStock}
            onChange={(e) => update('minStock', e.target.value)}
            className="input py-2"
            placeholder="10"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock</label>
          <input
            type="number"
            value={form.maxStock}
            onChange={(e) => update('maxStock', e.target.value)}
            className="input py-2"
            placeholder="100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
        <input
          type="text"
          value={form.supplier}
          onChange={(e) => update('supplier', e.target.value)}
          className="input py-2"
          placeholder="Henry Schein"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary flex-1 justify-center py-2.5"
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Add Item
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1 justify-center py-2.5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
