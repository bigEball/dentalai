import React, { useEffect, useState, useCallback } from 'react';
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingDown,
  Calendar,
  Truck,
  BarChart3,
  Check,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import api from '@/lib/api';

import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';


// ─── Types ──────────────────────────────────────────────────────────────────

interface DashboardStats {
  itemsBelowReorder: number;
  expiringSoon30: number;
  pendingOrdersValue: number;
  projectedSavings: number;
  totalInventoryValue: number;
  avgMonthlySpend: number;
  wasteValue: number;
  suppliersCount: number;
}

interface Prediction {
  itemName: string;
  category: string;
  currentStock: number;
  unit: string;
  predictedNeed: number;
  daysForecasted: number;
  surplus: number;
  status: 'sufficient' | 'warning' | 'critical';
  proceduresRequiring: string[];
}

interface PurchaseOrderItem {
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

interface PurchaseOrder {
  id: string;
  supplier: string;
  items: PurchaseOrderItem[];
  totalCost: number;
  status: 'draft' | 'approved' | 'ordered';
  createdAt: string;
}

interface ConsumptionItem {
  itemName: string;
  category: string;
  monthlyUsage: { month: string; quantity: number }[];
  avgMonthly: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  burnRate: number;
}

interface ExpiryAlert {
  itemName: string;
  currentStock: number;
  unit: string;
  expiryDate: string;
  daysUntilExpiry: number;
  urgency: 'critical' | 'warning' | 'info';
  estimatedLoss: number;
}

interface WasteExpired {
  name: string;
  quantity: number;
  unitCost: number;
  totalLoss: number;
  expiryDate: string;
}

interface WasteOverstocked {
  name: string;
  currentStock: number;
  maxStock: number;
  excess: number;
  excessCost: number;
}

interface WasteReport {
  expired: WasteExpired[];
  overstocked: WasteOverstocked[];
  totalWasteValue: number;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_DASHBOARD: DashboardStats = {
  itemsBelowReorder: 6,
  expiringSoon30: 3,
  pendingOrdersValue: 2847.5,
  projectedSavings: 412.3,
  totalInventoryValue: 14520.0,
  avgMonthlySpend: 3240.0,
  wasteValue: 371.9,
  suppliersCount: 8,
};

const MOCK_PREDICTIONS: Prediction[] = [
  { itemName: 'Nitrile Exam Gloves (M)', category: 'ppe', currentStock: 5, unit: 'box', predictedNeed: 32, daysForecasted: 7, surplus: -27, status: 'critical', proceduresRequiring: ['All procedures', 'Hygiene visits', 'Exams'] },
  { itemName: 'Anesthetic Carpules', category: 'surgical', currentStock: 12, unit: 'units', predictedNeed: 24, daysForecasted: 7, surplus: -12, status: 'critical', proceduresRequiring: ['Extractions', 'Root Canals', 'Crown Prep'] },
  { itemName: 'Composite Resin A2', category: 'restorative', currentStock: 8, unit: 'syringe', predictedNeed: 10, daysForecasted: 7, surplus: -2, status: 'warning', proceduresRequiring: ['Fillings', 'Crown Buildups'] },
  { itemName: 'Surgical Sutures 4-0', category: 'surgical', currentStock: 3, unit: 'pack', predictedNeed: 4, daysForecasted: 7, surplus: -1, status: 'warning', proceduresRequiring: ['Extractions', 'Implant placement'] },
  { itemName: 'Prophy Paste', category: 'preventive', currentStock: 14, unit: 'cup', predictedNeed: 8, daysForecasted: 7, surplus: 6, status: 'sufficient', proceduresRequiring: ['Hygiene visits', 'Cleanings'] },
  { itemName: 'Prophy Angles', category: 'preventive', currentStock: 20, unit: 'units', predictedNeed: 8, daysForecasted: 7, surplus: 12, status: 'sufficient', proceduresRequiring: ['Hygiene visits'] },
  { itemName: 'Fluoride Varnish', category: 'preventive', currentStock: 120, unit: 'unit dose', predictedNeed: 8, daysForecasted: 7, surplus: 112, status: 'sufficient', proceduresRequiring: ['Pediatric visits', 'Hygiene'] },
  { itemName: 'Gauze Pads', category: 'surgical', currentStock: 30, unit: 'units', predictedNeed: 15, daysForecasted: 7, surplus: 15, status: 'sufficient', proceduresRequiring: ['Extractions', 'Surgery'] },
  { itemName: 'Impression Material', category: 'restorative', currentStock: 10, unit: 'units', predictedNeed: 6, daysForecasted: 7, surplus: 4, status: 'sufficient', proceduresRequiring: ['Crown & Bridge', 'Dentures'] },
  { itemName: 'Bonding Agent', category: 'restorative', currentStock: 6, unit: 'units', predictedNeed: 2, daysForecasted: 7, surplus: 4, status: 'sufficient', proceduresRequiring: ['Fillings', 'Veneers'] },
];

const MOCK_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-1',
    supplier: 'Henry Schein',
    items: [
      { name: 'Composite Resin A2', quantity: 42, unit: 'syringe', unitCost: 45.0, totalCost: 1890.0 },
      { name: 'Dental Impression Trays', quantity: 50, unit: 'piece', unitCost: 1.2, totalCost: 60.0 },
    ],
    totalCost: 1950.0,
    status: 'draft',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'po-2',
    supplier: 'McKesson',
    items: [
      { name: 'Nitrile Exam Gloves (M)', quantity: 95, unit: 'box', unitCost: 12.0, totalCost: 1140.0 },
      { name: 'Face Masks Level 3', quantity: 20, unit: 'box', unitCost: 8.5, totalCost: 170.0 },
    ],
    totalCost: 1310.0,
    status: 'approved',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'po-3',
    supplier: 'Patterson Dental',
    items: [
      { name: 'Surgical Sutures 4-0', quantity: 37, unit: 'pack', unitCost: 28.0, totalCost: 1036.0 },
      { name: 'Anesthetic Carpules', quantity: 48, unit: 'units', unitCost: 3.25, totalCost: 156.0 },
    ],
    totalCost: 1192.0,
    status: 'draft',
    createdAt: new Date().toISOString(),
  },
];

const MOCK_CONSUMPTION: ConsumptionItem[] = [
  {
    itemName: 'Nitrile Gloves',
    category: 'ppe',
    monthlyUsage: [
      { month: 'Oct 2025', quantity: 42 }, { month: 'Nov 2025', quantity: 50 },
      { month: 'Dec 2025', quantity: 38 }, { month: 'Jan 2026', quantity: 52 },
      { month: 'Feb 2026', quantity: 46 }, { month: 'Mar 2026', quantity: 48 },
    ],
    avgMonthly: 46,
    trend: 'increasing',
    burnRate: 1.6,
  },
  {
    itemName: 'Anesthetic Carpules',
    category: 'surgical',
    monthlyUsage: [
      { month: 'Oct 2025', quantity: 31 }, { month: 'Nov 2025', quantity: 38 },
      { month: 'Dec 2025', quantity: 29 }, { month: 'Jan 2026', quantity: 40 },
      { month: 'Feb 2026', quantity: 34 }, { month: 'Mar 2026', quantity: 36 },
    ],
    avgMonthly: 35,
    trend: 'increasing',
    burnRate: 1.2,
  },
  {
    itemName: 'Gauze Pads',
    category: 'surgical',
    monthlyUsage: [
      { month: 'Oct 2025', quantity: 25 }, { month: 'Nov 2025', quantity: 30 },
      { month: 'Dec 2025', quantity: 22 }, { month: 'Jan 2026', quantity: 32 },
      { month: 'Feb 2026', quantity: 26 }, { month: 'Mar 2026', quantity: 28 },
    ],
    avgMonthly: 27,
    trend: 'stable',
    burnRate: 0.93,
  },
  {
    itemName: 'Composite Resin',
    category: 'restorative',
    monthlyUsage: [
      { month: 'Oct 2025', quantity: 19 }, { month: 'Nov 2025', quantity: 24 },
      { month: 'Dec 2025', quantity: 17 }, { month: 'Jan 2026', quantity: 25 },
      { month: 'Feb 2026', quantity: 20 }, { month: 'Mar 2026', quantity: 22 },
    ],
    avgMonthly: 21,
    trend: 'stable',
    burnRate: 0.73,
  },
  {
    itemName: 'Prophy Paste',
    category: 'preventive',
    monthlyUsage: [
      { month: 'Oct 2025', quantity: 15 }, { month: 'Nov 2025', quantity: 20 },
      { month: 'Dec 2025', quantity: 14 }, { month: 'Jan 2026', quantity: 21 },
      { month: 'Feb 2026', quantity: 16 }, { month: 'Mar 2026', quantity: 18 },
    ],
    avgMonthly: 17,
    trend: 'decreasing',
    burnRate: 0.6,
  },
];

const MOCK_EXPIRY_ALERTS: ExpiryAlert[] = [
  { itemName: 'Prophy Paste', currentStock: 14, unit: 'cup', expiryDate: '2026-04-30', daysUntilExpiry: 25, urgency: 'critical', estimatedLoss: 11.9 },
  { itemName: 'Composite Resin A2', currentStock: 8, unit: 'syringe', expiryDate: '2026-05-15', daysUntilExpiry: 40, urgency: 'warning', estimatedLoss: 360.0 },
  { itemName: 'Fluoride Varnish', currentStock: 120, unit: 'unit dose', expiryDate: '2026-06-20', daysUntilExpiry: 76, urgency: 'info', estimatedLoss: 300.0 },
  { itemName: 'Bonding Agent', currentStock: 6, unit: 'bottle', expiryDate: '2026-07-10', daysUntilExpiry: 96, urgency: 'info', estimatedLoss: 180.0 },
];

const MOCK_WASTE: WasteReport = {
  expired: [
    { name: 'Impression Material (old batch)', quantity: 5, unitCost: 18.0, totalLoss: 90.0, expiryDate: '2026-02-15' },
    { name: 'Etchant Gel', quantity: 3, unitCost: 12.5, totalLoss: 37.5, expiryDate: '2026-03-01' },
  ],
  overstocked: [
    { name: 'Fluoride Varnish', currentStock: 120, maxStock: 80, excess: 40, excessCost: 100.0 },
    { name: 'Prophy Angles', currentStock: 200, maxStock: 100, excess: 100, excessCost: 75.0 },
    { name: 'Printer Paper', currentStock: 25, maxStock: 15, excess: 10, excessCost: 69.9 },
  ],
  totalWasteValue: 372.4,
};

// ─── Chart Colors ───────────────────────────────────────────────────────────

const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

// ─── Helpers ────────────────────────────────────────────────────────────────

function categoryBadge(category: string): string {
  switch (category) {
    case 'restorative': return 'bg-blue-50 text-blue-700';
    case 'preventive': return 'bg-green-50 text-green-700';
    case 'surgical': return 'bg-red-50 text-red-700';
    case 'orthodontic': return 'bg-purple-50 text-purple-700';
    case 'office': return 'bg-gray-100 text-gray-600';
    case 'ppe': return 'bg-amber-50 text-amber-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function statusBadgeStyle(status: string): { bg: string; label: string } {
  switch (status) {
    case 'sufficient': return { bg: 'bg-green-100 text-green-700', label: 'Sufficient' };
    case 'warning': return { bg: 'bg-amber-100 text-amber-700', label: 'Warning' };
    case 'critical': return { bg: 'bg-red-100 text-red-700', label: 'Critical' };
    default: return { bg: 'bg-gray-100 text-gray-600', label: status };
  }
}

function orderStatusBadge(status: string): { bg: string; label: string } {
  switch (status) {
    case 'draft': return { bg: 'bg-gray-100 text-gray-600', label: 'Draft' };
    case 'approved': return { bg: 'bg-blue-50 text-blue-700', label: 'Approved' };
    case 'ordered': return { bg: 'bg-amber-50 text-amber-700', label: 'Ordered' };
    default: return { bg: 'bg-gray-100 text-gray-600', label: status };
  }
}

function urgencyStyle(urgency: string): { border: string; bg: string; label: string } {
  switch (urgency) {
    case 'critical': return { border: 'border-l-red-500', bg: 'bg-red-100 text-red-700', label: 'Critical' };
    case 'warning': return { border: 'border-l-amber-500', bg: 'bg-amber-100 text-amber-700', label: 'Warning' };
    case 'info': return { border: 'border-l-blue-500', bg: 'bg-blue-100 text-blue-700', label: 'Info' };
    default: return { border: 'border-l-gray-300', bg: 'bg-gray-100 text-gray-600', label: urgency };
  }
}

function trendIcon(trend: string) {
  switch (trend) {
    case 'increasing': return <ArrowUpRight size={14} className="text-red-500" />;
    case 'decreasing': return <ArrowDownRight size={14} className="text-green-500" />;
    default: return <span className="inline-block w-3.5 h-0.5 bg-gray-400 rounded" />;
  }
}

function trendLabel(trend: string): string {
  switch (trend) {
    case 'increasing': return 'Increasing';
    case 'decreasing': return 'Decreasing';
    default: return 'Stable';
  }
}

// ─── Tab type ───────────────────────────────────────────────────────────────

type Tab = 'forecast' | 'orders' | 'consumption' | 'expiry' | 'waste';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'forecast', label: 'Forecast', icon: <Calendar size={16} /> },
  { key: 'orders', label: 'Purchase Orders', icon: <ShoppingCart size={16} /> },
  { key: 'consumption', label: 'Consumption', icon: <BarChart3 size={16} /> },
  { key: 'expiry', label: 'Expiry Alerts', icon: <AlertTriangle size={16} /> },
  { key: 'waste', label: 'Waste Report', icon: <TrendingDown size={16} /> },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function ProcurementPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('forecast');
  const [generating, setGenerating] = useState(false);

  // Data
  const [dashboard, setDashboard] = useState<DashboardStats>(MOCK_DASHBOARD);
  const [predictions, setPredictions] = useState<Prediction[]>(MOCK_PREDICTIONS);
  const [orders, setOrders] = useState<PurchaseOrder[]>(MOCK_ORDERS);
  const [consumption, setConsumption] = useState<ConsumptionItem[]>(MOCK_CONSUMPTION);
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>(MOCK_EXPIRY_ALERTS);
  const [waste, setWaste] = useState<WasteReport>(MOCK_WASTE);
  const [forecastDays, setForecastDays] = useState(7);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchDashboard = useCallback(async () => {
    try {
      const { data } = await api.get<DashboardStats>('/procurement/dashboard');
      setDashboard(data);
    } catch {
      setDashboard(MOCK_DASHBOARD);
    }
  }, []);

  const fetchPredictions = useCallback(async (days: number) => {
    try {
      const { data } = await api.get<Prediction[]>('/procurement/predictions', { params: { days } });
      if (data.length > 0) setPredictions(data);
      else setPredictions(MOCK_PREDICTIONS);
    } catch {
      setPredictions(MOCK_PREDICTIONS);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get<PurchaseOrder[]>('/procurement/purchase-orders');
      if (data.length > 0) setOrders(data);
      else setOrders(MOCK_ORDERS);
    } catch {
      setOrders(MOCK_ORDERS);
    }
  }, []);

  const fetchConsumption = useCallback(async () => {
    try {
      const { data } = await api.get<ConsumptionItem[]>('/procurement/consumption');
      if (data.length > 0) setConsumption(data);
      else setConsumption(MOCK_CONSUMPTION);
    } catch {
      setConsumption(MOCK_CONSUMPTION);
    }
  }, []);

  const fetchExpiry = useCallback(async () => {
    try {
      const { data } = await api.get<ExpiryAlert[]>('/procurement/expiry-alerts');
      if (data.length > 0) setExpiryAlerts(data);
      else setExpiryAlerts(MOCK_EXPIRY_ALERTS);
    } catch {
      setExpiryAlerts(MOCK_EXPIRY_ALERTS);
    }
  }, []);

  const fetchWaste = useCallback(async () => {
    try {
      const { data } = await api.get<WasteReport>('/procurement/waste');
      setWaste(data);
    } catch {
      setWaste(MOCK_WASTE);
    }
  }, []);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      await Promise.all([
        fetchDashboard(),
        fetchPredictions(forecastDays),
        fetchOrders(),
        fetchConsumption(),
        fetchExpiry(),
        fetchWaste(),
      ]);
      setLoading(false);
    }
    loadAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch predictions when days change
  useEffect(() => {
    if (!loading) fetchPredictions(forecastDays);
  }, [forecastDays]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleGenerateOrders = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/procurement/purchase-orders/generate');
      if (data && Array.isArray(data) && data.length > 0) {
        setOrders(data);
        toast.success(`Generated ${data.length} purchase orders`);
      } else {
        toast.success('No items need reordering at this time');
      }
    } catch {
      toast.error('Failed to generate orders -- using demo data');
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      await api.patch(`/procurement/purchase-orders/${orderId}/approve`);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'approved' as const } : o
        )
      );
      toast.success('Purchase order approved');
    } catch {
      // Optimistic update for demo mode
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'approved' as const } : o
        )
      );
      toast.success('Purchase order approved');
    }
  };

  // ── Chart data ────────────────────────────────────────────────────────────

  const months = consumption.length > 0 ? consumption[0].monthlyUsage.map((m) => m.month) : [];
  const chartData = months.map((month, monthIdx) => {
    const point: Record<string, string | number> = { month };
    consumption.slice(0, 5).forEach((item) => {
      point[item.itemName] = item.monthlyUsage[monthIdx]?.quantity ?? 0;
    });
    return point;
  });
  const chartKeys = consumption.slice(0, 5).map((c) => c.itemName);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return <FullPageSpinner />;

  const totalExpiryLoss = expiryAlerts.reduce((sum, a) => sum + a.estimatedLoss, 0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supply Procurement Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">
            AI-powered supply forecasting, automated ordering, and waste prevention
          </p>
        </div>
        <button
          onClick={handleGenerateOrders}
          disabled={generating}
          className="btn-primary flex items-center gap-2"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Generate Orders
        </button>
      </div>

      {/* Stat Cards — Dark cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Items Below Reorder — Amber */}
        <div className="rounded-xl bg-amber-900 p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-amber-200 uppercase tracking-wider">Items Below Reorder</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{dashboard.itemsBelowReorder}</p>
              <p className="mt-1 text-xs text-amber-300">{dashboard.suppliersCount} suppliers tracked</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-800">
              <Package size={20} className="text-amber-200" />
            </div>
          </div>
        </div>

        {/* Expiring Soon — Red */}
        <div className="rounded-xl bg-red-900 p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-red-200 uppercase tracking-wider">Expiring Soon (30d)</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{dashboard.expiringSoon30}</p>
              <p className="mt-1 text-xs text-red-300">
                {totalExpiryLoss > 0 ? `${formatCurrency(totalExpiryLoss)} at risk` : 'All clear'}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-red-800">
              <AlertTriangle size={20} className="text-red-200" />
            </div>
          </div>
        </div>

        {/* Pending Orders — Blue */}
        <div className="rounded-xl bg-blue-900 p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-blue-200 uppercase tracking-wider">Pending Orders</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{formatCurrency(dashboard.pendingOrdersValue)}</p>
              <p className="mt-1 text-xs text-blue-300">
                {orders.filter((o) => o.status === 'draft').length} awaiting approval
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-800">
              <DollarSign size={20} className="text-blue-200" />
            </div>
          </div>
        </div>

        {/* Projected Savings — Green */}
        <div className="rounded-xl bg-green-900 p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-green-200 uppercase tracking-wider">Projected Savings</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{formatCurrency(dashboard.projectedSavings)}</p>
              <p className="mt-1 text-xs text-green-300">From bulk ordering optimization</p>
            </div>
            <div className="p-2.5 rounded-lg bg-green-800">
              <TrendingDown size={20} className="text-green-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ─── FORECAST TAB ────────────────────────────────────────────────── */}
      {activeTab === 'forecast' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Supply Forecast — Next {forecastDays} Days
              </h2>
              <p className="text-sm text-gray-500">
                {predictions.filter((p) => p.status === 'critical').length} critical deficit{predictions.filter((p) => p.status === 'critical').length !== 1 ? 's' : ''},{' '}
                {predictions.filter((p) => p.status === 'warning').length} warning{predictions.filter((p) => p.status === 'warning').length !== 1 ? 's' : ''} detected
              </p>
            </div>
            <select
              value={forecastDays}
              onChange={(e) => setForecastDays(parseInt(e.target.value, 10))}
              className="input w-32"
            >
              <option value={3}>3 Days</option>
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
            </select>
          </div>

          {predictions.length === 0 ? (
            <EmptyState
              icon={<Package size={40} />}
              title="No supply predictions"
              subtitle="No upcoming procedures found in the schedule."
            />
          ) : (
            <div className="card overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Predicted Need</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Surplus / Deficit</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {predictions.map((pred, idx) => {
                    const badge = statusBadgeStyle(pred.status);
                    return (
                      <tr key={idx} className={pred.status === 'critical' ? 'bg-red-50/40' : pred.status === 'warning' ? 'bg-amber-50/30' : ''}>
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{pred.itemName}</span>
                            {pred.proceduresRequiring.length > 0 && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                                {pred.proceduresRequiring.join(', ')}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', categoryBadge(pred.category))}>
                            {pred.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700">
                          {pred.currentStock} {pred.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700">
                          {pred.predictedNeed} {pred.unit}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            'inline-flex items-center gap-1 text-sm font-semibold',
                            pred.surplus < 0 ? 'text-red-600' : pred.surplus === 0 ? 'text-amber-600' : 'text-green-600'
                          )}>
                            {pred.surplus < 0 ? (
                              <ArrowDownRight size={14} />
                            ) : pred.surplus > 0 ? (
                              <ArrowUpRight size={14} />
                            ) : null}
                            {pred.surplus > 0 ? '+' : ''}{pred.surplus} {pred.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full', badge.bg)}>
                            {pred.status === 'sufficient' && <Check size={12} />}
                            {pred.status === 'warning' && <Clock size={12} />}
                            {pred.status === 'critical' && <AlertTriangle size={12} />}
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {pred.status === 'critical' && (
                            <button
                              onClick={() => {
                                setActiveTab('orders');
                                toast.success(`Order needed for ${pred.itemName}`);
                              }}
                              className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Order
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── PURCHASE ORDERS TAB ─────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Purchase Orders</h2>
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-500">
                {orders.length} order{orders.length !== 1 ? 's' : ''} totaling {formatCurrency(orders.reduce((s, o) => s + o.totalCost, 0))}
              </p>
              <button
                onClick={handleGenerateOrders}
                disabled={generating}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Generate Orders
              </button>
            </div>
          </div>

          {orders.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart size={40} />}
              title="No purchase orders"
              subtitle="Click 'Generate Orders' to auto-create orders for low-stock items."
            />
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const badge = orderStatusBadge(order.status);
                const isExpanded = expandedOrder === order.id;
                return (
                  <div key={order.id} className="card overflow-hidden">
                    {/* Order Header */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <Truck size={20} className="text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{order.supplier}</h3>
                          <p className="text-xs text-gray-500">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''} -- Created {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-gray-900 tabular-nums">
                          {formatCurrency(order.totalCost)}
                        </span>
                        <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', badge.bg)}>
                          {badge.label}
                        </span>
                        {order.status === 'draft' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleApproveOrder(order.id); }}
                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                          >
                            <Check size={14} />
                            Approve
                          </button>
                        )}
                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </div>

                    {/* Order Items */}
                    {isExpanded && (
                      <div className="border-t border-gray-100">
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Unit Cost</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {order.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-2.5 text-sm text-gray-900">{item.name}</td>
                                <td className="px-4 py-2.5 text-sm text-right text-gray-700">
                                  {item.quantity} {item.unit}
                                </td>
                                <td className="px-4 py-2.5 text-sm text-right text-gray-500">
                                  {formatCurrency(item.unitCost)}
                                </td>
                                <td className="px-4 py-2.5 text-sm text-right font-semibold text-gray-900">
                                  {formatCurrency(item.totalCost)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50">
                              <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-700 text-right">
                                Grand Total
                              </td>
                              <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                                {formatCurrency(order.totalCost)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── CONSUMPTION TAB ─────────────────────────────────────────────── */}
      {activeTab === 'consumption' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Consumption Trends</h2>

          {/* Line Chart */}
          <div className="card p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Top 5 Items — Monthly Consumption (6 Months)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  {chartKeys.map((key, idx) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Burn Rate Table */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700">Item Burn Rates & Trends</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Monthly</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Burn</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {consumption.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.itemName}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', categoryBadge(item.category))}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{item.avgMonthly}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{item.burnRate}/day</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {trendIcon(item.trend)}
                        <span className={cn(
                          'text-xs font-medium',
                          item.trend === 'increasing' ? 'text-red-600' :
                          item.trend === 'decreasing' ? 'text-green-600' :
                          'text-gray-500'
                        )}>
                          {trendLabel(item.trend)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── EXPIRY ALERTS TAB ───────────────────────────────────────────── */}
      {activeTab === 'expiry' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Expiry Alerts</h2>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                {expiryAlerts.filter((a) => a.urgency === 'critical').length} Critical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                {expiryAlerts.filter((a) => a.urgency === 'warning').length} Warning
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                {expiryAlerts.filter((a) => a.urgency === 'info').length} Info
              </span>
            </div>
          </div>

          {expiryAlerts.length === 0 ? (
            <EmptyState
              icon={<Check size={40} />}
              title="No expiry alerts"
              subtitle="All inventory items have safe expiry dates."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...expiryAlerts]
                .sort((a, b) => {
                  const order = { critical: 0, warning: 1, info: 2 };
                  return (order[a.urgency] ?? 3) - (order[b.urgency] ?? 3);
                })
                .map((alert, idx) => {
                  const style = urgencyStyle(alert.urgency);
                  return (
                    <div key={idx} className={cn('card p-4 border-l-4', style.border)}>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">{alert.itemName}</h3>
                        <span className={cn('text-xs font-medium px-2 py-1 rounded-full', style.bg)}>
                          {style.label}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Stock</span>
                          <span className="text-gray-900">{alert.currentStock} {alert.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Expires</span>
                          <span className={cn(
                            'font-medium',
                            alert.urgency === 'critical' ? 'text-red-600' : 'text-gray-900'
                          )}>
                            {formatDate(alert.expiryDate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Days Until Expiry</span>
                          <span className={cn(
                            'font-semibold',
                            alert.daysUntilExpiry <= 30 ? 'text-red-600' :
                            alert.daysUntilExpiry <= 60 ? 'text-amber-600' :
                            'text-gray-900'
                          )}>
                            {alert.daysUntilExpiry}d
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                          <span className="text-gray-500">Estimated Loss</span>
                          <span className="font-semibold text-red-600">{formatCurrency(alert.estimatedLoss)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {totalExpiryLoss > 0 && (
            <div className="card p-4 bg-red-50 border-red-200">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Total Estimated Loss: {formatCurrency(totalExpiryLoss)}
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Consider using soon-to-expire items first or returning to suppliers if possible.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── WASTE REPORT TAB ────────────────────────────────────────────── */}
      {activeTab === 'waste' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Waste Report</h2>
            <div className="card inline-flex items-center gap-2 px-4 py-2 bg-red-50 border-red-200">
              <DollarSign size={16} className="text-red-600" />
              <span className="text-sm text-gray-700">Total Waste Value:</span>
              <span className="text-sm font-bold text-red-600">{formatCurrency(waste.totalWasteValue)}</span>
            </div>
          </div>

          {/* Expired Items Table */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                Expired Items
                <span className="text-xs font-normal text-gray-500">({waste.expired.length} items)</span>
              </h3>
            </div>
            {waste.expired.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">No expired items</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Loss</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expired</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {waste.expired.map((item, idx) => (
                    <tr key={idx} className="bg-red-50/30">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">{formatCurrency(item.unitCost)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">{formatCurrency(item.totalLoss)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">{formatDate(item.expiryDate)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-700 text-right">Subtotal</td>
                    <td className="px-4 py-2 text-sm font-bold text-red-600 text-right">
                      {formatCurrency(waste.expired.reduce((s, i) => s + i.totalLoss, 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Overstocked Items Table */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Package size={16} className="text-blue-500" />
                Overstocked Items
                <span className="text-xs font-normal text-gray-500">({waste.overstocked.length} items)</span>
              </h3>
            </div>
            {waste.overstocked.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">No overstocked items</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Max Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Excess</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Excess Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {waste.overstocked.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{item.currentStock}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">{item.maxStock}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-amber-600">+{item.excess}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">{formatCurrency(item.excessCost)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="px-4 py-2 text-sm font-medium text-gray-700 text-right">Subtotal</td>
                    <td className="px-4 py-2 text-sm font-bold text-red-600 text-right">
                      {formatCurrency(waste.overstocked.reduce((s, i) => s + i.excessCost, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
