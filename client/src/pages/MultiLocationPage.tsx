import React, { useEffect, useState, useCallback } from 'react';
import {
  Building2,
  MapPin,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Award,
  ChevronRight,
  Users,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
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

import { formatCurrency, cn } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';


// ─── Types ──────────────────────────────────────────────────────────────────

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  chairs: number;
  providers: number;
  pms: string;
  phone: string;
}

interface LocationKPIs {
  locationId: string;
  locationName: string;
  production: { dailyAvg: number; monthlyTotal: number; perProvider: number; perChair: number };
  collections: { total: number; rate: number; daysInAR: number };
  patients: { active: number; newPerMonth: number; attritionRate: number; avgVisitsPerYear: number };
  caseAcceptance: { rate: number; avgPlanValue: number; conversionRate: number };
  scheduling: { chairUtilization: number; noShowRate: number; sameDayCancellation: number };
  revenue: { perPatient: number; perVisit: number; hygieneRevenuePct: number; restorativeRevenuePct: number };
  staff: { providers: number; hygienists: number; support: number; ftes: number };
  overhead: { ratio: number; supplyCostPct: number; labCostPct: number };
}

interface DashboardData {
  totalLocations: number;
  combinedMonthlyProduction: number;
  groupCollectionRate: number;
  avgPatientCount: number;
  totalActivePatients: number;
  topPerformer: string;
  bottomPerformer: string;
}

interface ComparisonMetric {
  value: number;
  rank: number;
  vsGroupAvg: number;
  status: string;
}

interface ComparisonLocation {
  id: string;
  name: string;
  metrics: Record<string, ComparisonMetric>;
}

interface ComparisonData {
  kpis: string[];
  locations: ComparisonLocation[];
}

interface RootCauseArea {
  area: string;
  currentValue: number;
  groupAvg: number;
  gap: number;
  possibleCauses: string[];
  recommendations: string[];
}

interface RootCauseData {
  locationId: string;
  locationName: string;
  underperformingAreas: RootCauseArea[];
}

interface GroupReport {
  totalProduction: number;
  totalCollections: number;
  totalPatients: number;
  locationRankings: { id: string; name: string; score: number; rank: number }[];
  groupHealthScore: number;
}

interface TrendDataPoint {
  month: string;
  production: number;
  collections: number;
  patients: number;
  utilization: number;
}

interface TrendLocation {
  id: string;
  name: string;
  data: TrendDataPoint[];
}

interface TrendsData {
  months: string[];
  locations: TrendLocation[];
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_LOCATIONS: Location[] = [
  { id: 'loc1', name: 'Downtown', address: '100 Main St', city: 'Denver', chairs: 8, providers: 4, pms: 'Open Dental', phone: '(303) 555-0101' },
  { id: 'loc2', name: 'Westside', address: '250 Oak Ave', city: 'Lakewood', chairs: 6, providers: 3, pms: 'Open Dental', phone: '(303) 555-0202' },
  { id: 'loc3', name: 'Northpark', address: '780 Elm Blvd', city: 'Thornton', chairs: 5, providers: 2, pms: 'Dentrix', phone: '(303) 555-0303' },
  { id: 'loc4', name: 'Lakewood', address: '420 Pine Dr', city: 'Lakewood', chairs: 7, providers: 4, pms: 'Open Dental', phone: '(303) 555-0404' },
  { id: 'loc5', name: 'Eastgate', address: '90 Spruce Ln', city: 'Aurora', chairs: 4, providers: 2, pms: 'Eaglesoft', phone: '(303) 555-0505' },
];

const MOCK_DASHBOARD: DashboardData = {
  totalLocations: 5,
  combinedMonthlyProduction: 964000,
  groupCollectionRate: 94.6,
  avgPatientCount: 1740,
  totalActivePatients: 8700,
  topPerformer: 'Lakewood',
  bottomPerformer: 'Eastgate',
};

const MOCK_KPIS: LocationKPIs[] = [
  {
    locationId: 'loc1', locationName: 'Downtown',
    production: { dailyAvg: 12500, monthlyTotal: 250000, perProvider: 62500, perChair: 31250 },
    collections: { total: 232500, rate: 93.0, daysInAR: 32 },
    patients: { active: 2200, newPerMonth: 45, attritionRate: 3.2, avgVisitsPerYear: 2.8 },
    caseAcceptance: { rate: 62, avgPlanValue: 3200, conversionRate: 55 },
    scheduling: { chairUtilization: 82, noShowRate: 8, sameDayCancellation: 5 },
    revenue: { perPatient: 420, perVisit: 285, hygieneRevenuePct: 28, restorativeRevenuePct: 45 },
    staff: { providers: 4, hygienists: 3, support: 5, ftes: 12 },
    overhead: { ratio: 72, supplyCostPct: 8, labCostPct: 11 },
  },
  {
    locationId: 'loc2', locationName: 'Westside',
    production: { dailyAvg: 9800, monthlyTotal: 196000, perProvider: 65333, perChair: 32667 },
    collections: { total: 188160, rate: 96.0, daysInAR: 24 },
    patients: { active: 1800, newPerMonth: 38, attritionRate: 2.1, avgVisitsPerYear: 3.1 },
    caseAcceptance: { rate: 74, avgPlanValue: 2800, conversionRate: 68 },
    scheduling: { chairUtilization: 85, noShowRate: 5, sameDayCancellation: 3 },
    revenue: { perPatient: 395, perVisit: 260, hygieneRevenuePct: 32, restorativeRevenuePct: 40 },
    staff: { providers: 3, hygienists: 2, support: 4, ftes: 9 },
    overhead: { ratio: 62, supplyCostPct: 6, labCostPct: 9 },
  },
  {
    locationId: 'loc3', locationName: 'Northpark',
    production: { dailyAvg: 7200, monthlyTotal: 144000, perProvider: 72000, perChair: 28800 },
    collections: { total: 138240, rate: 96.0, daysInAR: 22 },
    patients: { active: 1500, newPerMonth: 25, attritionRate: 1.8, avgVisitsPerYear: 3.4 },
    caseAcceptance: { rate: 68, avgPlanValue: 2400, conversionRate: 60 },
    scheduling: { chairUtilization: 78, noShowRate: 4, sameDayCancellation: 2 },
    revenue: { perPatient: 350, perVisit: 240, hygieneRevenuePct: 35, restorativeRevenuePct: 38 },
    staff: { providers: 2, hygienists: 2, support: 3, ftes: 7 },
    overhead: { ratio: 65, supplyCostPct: 7, labCostPct: 8 },
  },
  {
    locationId: 'loc4', locationName: 'Lakewood',
    production: { dailyAvg: 14200, monthlyTotal: 284000, perProvider: 71000, perChair: 40571 },
    collections: { total: 261280, rate: 92.0, daysInAR: 36 },
    patients: { active: 2400, newPerMonth: 52, attritionRate: 4.1, avgVisitsPerYear: 2.6 },
    caseAcceptance: { rate: 58, avgPlanValue: 3600, conversionRate: 50 },
    scheduling: { chairUtilization: 90, noShowRate: 12, sameDayCancellation: 7 },
    revenue: { perPatient: 460, perVisit: 310, hygieneRevenuePct: 24, restorativeRevenuePct: 48 },
    staff: { providers: 4, hygienists: 3, support: 5, ftes: 12 },
    overhead: { ratio: 68, supplyCostPct: 7, labCostPct: 10 },
  },
  {
    locationId: 'loc5', locationName: 'Eastgate',
    production: { dailyAvg: 4500, monthlyTotal: 90000, perProvider: 45000, perChair: 22500 },
    collections: { total: 86400, rate: 96.0, daysInAR: 20 },
    patients: { active: 800, newPerMonth: 30, attritionRate: 1.5, avgVisitsPerYear: 2.9 },
    caseAcceptance: { rate: 70, avgPlanValue: 2200, conversionRate: 64 },
    scheduling: { chairUtilization: 72, noShowRate: 6, sameDayCancellation: 4 },
    revenue: { perPatient: 380, perVisit: 250, hygieneRevenuePct: 30, restorativeRevenuePct: 42 },
    staff: { providers: 2, hygienists: 1, support: 2, ftes: 5 },
    overhead: { ratio: 70, supplyCostPct: 9, labCostPct: 10 },
  },
];

const MOCK_COMPARISON: ComparisonData = {
  kpis: ['Production', 'Collections', 'Patients', 'Utilization', 'Case Accept', 'No-Show', 'Overhead'],
  locations: [
    {
      id: 'loc1', name: 'Downtown',
      metrics: {
        Production: { value: 250000, rank: 2, vsGroupAvg: 29.6, status: 'above' },
        Collections: { value: 93.0, rank: 4, vsGroupAvg: -1.7, status: 'below' },
        Patients: { value: 2200, rank: 2, vsGroupAvg: 26.4, status: 'above' },
        Utilization: { value: 82, rank: 3, vsGroupAvg: 0.7, status: 'average' },
        'Case Accept': { value: 62, rank: 4, vsGroupAvg: -6.6, status: 'below' },
        'No-Show': { value: 8, rank: 4, vsGroupAvg: 14.3, status: 'below' },
        Overhead: { value: 72, rank: 5, vsGroupAvg: 6.8, status: 'below' },
      },
    },
    {
      id: 'loc2', name: 'Westside',
      metrics: {
        Production: { value: 196000, rank: 3, vsGroupAvg: 1.7, status: 'average' },
        Collections: { value: 96.0, rank: 1, vsGroupAvg: 1.5, status: 'above' },
        Patients: { value: 1800, rank: 3, vsGroupAvg: 3.4, status: 'average' },
        Utilization: { value: 85, rank: 2, vsGroupAvg: 4.4, status: 'above' },
        'Case Accept': { value: 74, rank: 1, vsGroupAvg: 11.4, status: 'above' },
        'No-Show': { value: 5, rank: 2, vsGroupAvg: -28.6, status: 'above' },
        Overhead: { value: 62, rank: 1, vsGroupAvg: -8.0, status: 'above' },
      },
    },
    {
      id: 'loc3', name: 'Northpark',
      metrics: {
        Production: { value: 144000, rank: 4, vsGroupAvg: -25.3, status: 'below' },
        Collections: { value: 96.0, rank: 1, vsGroupAvg: 1.5, status: 'above' },
        Patients: { value: 1500, rank: 4, vsGroupAvg: -13.8, status: 'below' },
        Utilization: { value: 78, rank: 4, vsGroupAvg: -4.2, status: 'below' },
        'Case Accept': { value: 68, rank: 3, vsGroupAvg: 2.4, status: 'average' },
        'No-Show': { value: 4, rank: 1, vsGroupAvg: -42.9, status: 'above' },
        Overhead: { value: 65, rank: 2, vsGroupAvg: -3.6, status: 'above' },
      },
    },
    {
      id: 'loc4', name: 'Lakewood',
      metrics: {
        Production: { value: 284000, rank: 1, vsGroupAvg: 47.3, status: 'above' },
        Collections: { value: 92.0, rank: 5, vsGroupAvg: -2.7, status: 'below' },
        Patients: { value: 2400, rank: 1, vsGroupAvg: 37.9, status: 'above' },
        Utilization: { value: 90, rank: 1, vsGroupAvg: 10.5, status: 'above' },
        'Case Accept': { value: 58, rank: 5, vsGroupAvg: -12.7, status: 'below' },
        'No-Show': { value: 12, rank: 5, vsGroupAvg: 71.4, status: 'below' },
        Overhead: { value: 68, rank: 4, vsGroupAvg: 0.9, status: 'average' },
      },
    },
    {
      id: 'loc5', name: 'Eastgate',
      metrics: {
        Production: { value: 90000, rank: 5, vsGroupAvg: -53.3, status: 'below' },
        Collections: { value: 96.0, rank: 1, vsGroupAvg: 1.5, status: 'above' },
        Patients: { value: 800, rank: 5, vsGroupAvg: -54.0, status: 'below' },
        Utilization: { value: 72, rank: 5, vsGroupAvg: -11.6, status: 'below' },
        'Case Accept': { value: 70, rank: 2, vsGroupAvg: 5.4, status: 'above' },
        'No-Show': { value: 6, rank: 3, vsGroupAvg: -14.3, status: 'average' },
        Overhead: { value: 70, rank: 3, vsGroupAvg: 3.9, status: 'average' },
      },
    },
  ],
};

const MOCK_TRENDS: TrendsData = {
  months: ['Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026'],
  locations: [
    {
      id: 'loc1', name: 'Downtown',
      data: [
        { month: 'Nov 2025', production: 235000, collections: 218000, patients: 2100, utilization: 80 },
        { month: 'Dec 2025', production: 220000, collections: 207000, patients: 2120, utilization: 76 },
        { month: 'Jan 2026', production: 240000, collections: 225000, patients: 2150, utilization: 81 },
        { month: 'Feb 2026', production: 245000, collections: 228000, patients: 2170, utilization: 83 },
        { month: 'Mar 2026', production: 248000, collections: 231000, patients: 2190, utilization: 82 },
        { month: 'Apr 2026', production: 250000, collections: 232500, patients: 2200, utilization: 82 },
      ],
    },
    {
      id: 'loc2', name: 'Westside',
      data: [
        { month: 'Nov 2025', production: 180000, collections: 174000, patients: 1700, utilization: 82 },
        { month: 'Dec 2025', production: 175000, collections: 169000, patients: 1720, utilization: 80 },
        { month: 'Jan 2026', production: 185000, collections: 178000, patients: 1740, utilization: 83 },
        { month: 'Feb 2026', production: 190000, collections: 183000, patients: 1760, utilization: 84 },
        { month: 'Mar 2026', production: 193000, collections: 186000, patients: 1780, utilization: 85 },
        { month: 'Apr 2026', production: 196000, collections: 188160, patients: 1800, utilization: 85 },
      ],
    },
    {
      id: 'loc3', name: 'Northpark',
      data: [
        { month: 'Nov 2025', production: 130000, collections: 126000, patients: 1420, utilization: 74 },
        { month: 'Dec 2025', production: 125000, collections: 121000, patients: 1430, utilization: 72 },
        { month: 'Jan 2026', production: 135000, collections: 130000, patients: 1450, utilization: 75 },
        { month: 'Feb 2026', production: 138000, collections: 133000, patients: 1470, utilization: 76 },
        { month: 'Mar 2026', production: 141000, collections: 136000, patients: 1490, utilization: 77 },
        { month: 'Apr 2026', production: 144000, collections: 138240, patients: 1500, utilization: 78 },
      ],
    },
    {
      id: 'loc4', name: 'Lakewood',
      data: [
        { month: 'Nov 2025', production: 260000, collections: 238000, patients: 2250, utilization: 87 },
        { month: 'Dec 2025', production: 255000, collections: 232000, patients: 2280, utilization: 85 },
        { month: 'Jan 2026', production: 270000, collections: 248000, patients: 2320, utilization: 88 },
        { month: 'Feb 2026', production: 275000, collections: 252000, patients: 2350, utilization: 89 },
        { month: 'Mar 2026', production: 280000, collections: 257000, patients: 2380, utilization: 90 },
        { month: 'Apr 2026', production: 284000, collections: 261280, patients: 2400, utilization: 90 },
      ],
    },
    {
      id: 'loc5', name: 'Eastgate',
      data: [
        { month: 'Nov 2025', production: 60000, collections: 58000, patients: 580, utilization: 62 },
        { month: 'Dec 2025', production: 65000, collections: 63000, patients: 620, utilization: 64 },
        { month: 'Jan 2026', production: 72000, collections: 69000, patients: 670, utilization: 67 },
        { month: 'Feb 2026', production: 78000, collections: 75000, patients: 720, utilization: 69 },
        { month: 'Mar 2026', production: 85000, collections: 82000, patients: 760, utilization: 71 },
        { month: 'Apr 2026', production: 90000, collections: 86400, patients: 800, utilization: 72 },
      ],
    },
  ],
};

const MOCK_ROOT_CAUSES: Record<string, RootCauseData> = {
  loc1: {
    locationId: 'loc1', locationName: 'Downtown',
    underperformingAreas: [
      {
        area: 'Overhead Ratio', currentValue: 72, groupAvg: 67.4, gap: 6.8,
        possibleCauses: ['Premium downtown lease driving occupancy costs above $28/sq ft', 'Higher staff wages due to urban cost-of-living adjustments', 'Underutilized sterilization equipment from recent expansion'],
        recommendations: ['Renegotiate lease at next renewal or explore subletting unused operatory', 'Cross-train front desk staff to reduce need for additional hire', 'Audit supply ordering — switch to GPO purchasing for 8-12% savings'],
      },
      {
        area: 'Case Acceptance', currentValue: 62, groupAvg: 66.4, gap: -6.6,
        possibleCauses: ['Treatment coordinators presenting plans without financial options', 'High out-of-pocket costs deterring patients in mixed-insurance demographic', 'Insufficient follow-up on unsigned treatment plans'],
        recommendations: ['Implement same-day financial consultations with payment plan options', 'Train treatment coordinators on value-based presentation techniques', 'Add automated 48-hour follow-up sequence for unaccepted plans'],
      },
    ],
  },
  loc2: {
    locationId: 'loc2', locationName: 'Westside',
    underperformingAreas: [
      {
        area: 'Production Volume', currentValue: 196000, groupAvg: 192800, gap: 1.7,
        possibleCauses: ['Slightly below peak capacity due to one unfilled hygiene slot per day', 'Conservative treatment planning approach limiting per-visit production'],
        recommendations: ['Add a same-day hygiene availability slot to capture last-minute bookings', 'Review incomplete treatment plans for re-presentation opportunities'],
      },
    ],
  },
  loc3: {
    locationId: 'loc3', locationName: 'Northpark',
    underperformingAreas: [
      {
        area: 'Production Volume', currentValue: 144000, groupAvg: 192800, gap: -25.3,
        possibleCauses: ['Only 2 providers limiting patient throughput capacity', 'Lower chair count restricts simultaneous appointments', 'Dentrix PMS limiting some automated scheduling features'],
        recommendations: ['Recruit a part-time associate dentist for 2-3 days per week', 'Evaluate adding a 6th operatory to match provider capacity', 'Invest in Dentrix-to-Open Dental migration to unify group PMS'],
      },
      {
        area: 'Chair Utilization', currentValue: 78, groupAvg: 81.4, gap: -4.2,
        possibleCauses: ['Longer appointment blocks than necessary for routine procedures', 'Gaps between hygiene and doctor exams creating idle time', 'No online scheduling driving phone-only booking inefficiency'],
        recommendations: ['Implement 10-minute huddle to review daily schedule and identify gaps', 'Enable online scheduling to fill same-day openings automatically', 'Reduce standard adult prophy block from 60 to 50 minutes'],
      },
    ],
  },
  loc4: {
    locationId: 'loc4', locationName: 'Lakewood',
    underperformingAreas: [
      {
        area: 'No-Show Rate', currentValue: 12, groupAvg: 7.0, gap: 71.4,
        possibleCauses: ['Inadequate appointment confirmation sequence — single reminder only', 'High new patient volume from marketing with lower commitment level', 'No deposit or pre-payment policy for high-value appointments'],
        recommendations: ['Implement 3-touch confirmation: 72hr email, 24hr text, 2hr text', 'Require credit card on file for new patient appointments over $500', 'Analyze no-show patterns by day/time and adjust scheduling accordingly'],
      },
      {
        area: 'Collection Rate', currentValue: 92, groupAvg: 94.6, gap: -2.7,
        possibleCauses: ['Higher AR days (36) suggest slow insurance claim follow-up', 'Same-day cancellations (7%) creating unbilled chair time', 'Patient portion collections lagging due to inadequate point-of-service collection'],
        recommendations: ['Assign dedicated insurance coordinator to work claims over 30 days', 'Implement pre-visit benefit verification to collect copays upfront', 'Add automated patient balance text-to-pay after each visit'],
      },
      {
        area: 'Case Acceptance', currentValue: 58, groupAvg: 66.4, gap: -12.7,
        possibleCauses: ['High production volume may mean less time spent on case presentation', 'Patients overwhelmed by large treatment plans without phased options', 'Treatment coordinators not following up on pending plans'],
        recommendations: ['Phase large treatment plans into priority-based stages', 'Dedicate 15 minutes per case presentation instead of 5-minute overview', 'Implement weekly unaccepted plan review and outreach campaign'],
      },
    ],
  },
  loc5: {
    locationId: 'loc5', locationName: 'Eastgate',
    underperformingAreas: [
      {
        area: 'Production Volume', currentValue: 90000, groupAvg: 192800, gap: -53.3,
        possibleCauses: ['Newest location still building patient base — open only 14 months', 'Only 4 chairs and 2 providers limit max daily capacity', 'Marketing spend not yet at group-average levels'],
        recommendations: ['Increase local SEO and Google Ads budget by 40% to accelerate growth', 'Launch a new patient referral bonus program ($50 credit per referral)', 'Plan for 6th chair buildout when utilization consistently exceeds 80%'],
      },
      {
        area: 'Chair Utilization', currentValue: 72, groupAvg: 81.4, gap: -11.6,
        possibleCauses: ['Low patient volume not yet filling available appointment slots', 'Limited hygiene hours — only 1 hygienist on staff', 'New location awareness still growing in community'],
        recommendations: ['Hire a second part-time hygienist to open morning hygiene slots', 'Partner with 3 local businesses for employee dental benefit programs', 'Host a community open house event with free screenings'],
      },
    ],
  },
};

const MOCK_GROUP_REPORT: GroupReport = {
  totalProduction: 964000,
  totalCollections: 906580,
  totalPatients: 8700,
  locationRankings: [
    { id: 'loc4', name: 'Lakewood', score: 88, rank: 1 },
    { id: 'loc2', name: 'Westside', score: 85, rank: 2 },
    { id: 'loc1', name: 'Downtown', score: 78, rank: 3 },
    { id: 'loc3', name: 'Northpark', score: 74, rank: 4 },
    { id: 'loc5', name: 'Eastgate', score: 68, rank: 5 },
  ],
  groupHealthScore: 79,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Compare', 'Trends', 'Root Cause', 'Group Report'] as const;
type Tab = typeof TABS[number];

const LOCATION_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const TREND_KPI_OPTIONS = [
  { key: 'production', label: 'Production' },
  { key: 'collections', label: 'Collections' },
  { key: 'patients', label: 'Patients' },
  { key: 'utilization', label: 'Utilization' },
] as const;
type TrendKPI = typeof TREND_KPI_OPTIONS[number]['key'];

function pct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function compactCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return formatCurrency(value);
}

function heatmapColor(rank: number, total: number, invertBetter?: boolean): string {
  const normalized = invertBetter ? (total - rank) / (total - 1) : (rank - 1) / (total - 1);
  if (normalized <= 0.2) return 'bg-green-100 text-green-900';
  if (normalized <= 0.4) return 'bg-green-50 text-green-800';
  if (normalized <= 0.6) return 'bg-yellow-50 text-yellow-800';
  if (normalized <= 0.8) return 'bg-orange-50 text-orange-800';
  return 'bg-red-100 text-red-900';
}

function isInvertedKPI(kpi: string): boolean {
  return kpi === 'No-Show' || kpi === 'Overhead';
}

function statusIndicator(value: number, avg: number, inverted?: boolean): React.ReactNode {
  const isGood = inverted ? value < avg : value > avg;
  const isBad = inverted ? value > avg : value < avg;
  if (isGood) return <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />;
  if (isBad) return <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5" />;
  return <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1.5" />;
}

function priorityBadge(index: number): React.ReactNode {
  const labels = ['High', 'Medium', 'Low'];
  const colors = ['bg-red-100 text-red-700', 'bg-yellow-100 text-yellow-700', 'bg-blue-100 text-blue-700'];
  const label = labels[Math.min(index, 2)];
  const color = colors[Math.min(index, 2)];
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0', color)}>{label}</span>;
}

// ─── Group Summary Header ───────────────────────────────────────────────────

function GroupSummaryHeader({ data }: { data: DashboardData }) {
  const stats = [
    { label: 'Total Locations', value: data.totalLocations, icon: Building2, fmt: (v: number) => String(v) },
    { label: 'Combined Monthly Production', value: data.combinedMonthlyProduction, icon: BarChart3, fmt: compactCurrency },
    { label: 'Group Collection Rate', value: data.groupCollectionRate, icon: Target, fmt: pct },
    { label: 'Avg Patient Count', value: data.avgPatientCount, icon: Users, fmt: (v: number) => v.toLocaleString() },
    { label: 'Total Active Patients', value: data.totalActivePatients, icon: Users, fmt: (v: number) => v.toLocaleString() },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <s.icon className="w-4 h-4" />
            {s.label}
          </div>
          <div className="text-2xl font-bold text-gray-900">{s.fmt(s.value)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Location Performance Grid ──────────────────────────────────────────────

function LocationPerformanceGrid({
  locations,
  kpis,
  selectedId,
  onSelect,
}: {
  locations: Location[];
  kpis: LocationKPIs[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const avgProduction = kpis.reduce((s, k) => s + k.production.monthlyTotal, 0) / kpis.length;
  const avgCollectionRate = kpis.reduce((s, k) => s + k.collections.rate, 0) / kpis.length;
  const avgUtilization = kpis.reduce((s, k) => s + k.scheduling.chairUtilization, 0) / kpis.length;
  const avgCaseAccept = kpis.reduce((s, k) => s + k.caseAcceptance.rate, 0) / kpis.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {locations.map((loc) => {
        const k = kpis.find((kpi) => kpi.locationId === loc.id);
        if (!k) return null;
        const isSelected = selectedId === loc.id;
        return (
          <button
            key={loc.id}
            onClick={() => onSelect(loc.id)}
            className={cn(
              'text-left bg-white rounded-xl border-2 p-4 shadow-sm transition-all hover:shadow-md',
              isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{loc.name}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {loc.city}
                </p>
              </div>
              <ChevronRight className={cn('w-4 h-4 text-gray-400 transition-transform', isSelected && 'rotate-90 text-blue-500')} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Production</span>
                <span className="font-medium flex items-center">
                  {statusIndicator(k.production.monthlyTotal, avgProduction)}
                  {compactCurrency(k.production.monthlyTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Collection Rate</span>
                <span className="font-medium flex items-center">
                  {statusIndicator(k.collections.rate, avgCollectionRate)}
                  {pct(k.collections.rate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Utilization</span>
                <span className="font-medium flex items-center">
                  {statusIndicator(k.scheduling.chairUtilization, avgUtilization)}
                  {pct(k.scheduling.chairUtilization)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Case Accept</span>
                <span className="font-medium flex items-center">
                  {statusIndicator(k.caseAcceptance.rate, avgCaseAccept)}
                  {pct(k.caseAcceptance.rate)}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────────────────

function OverviewTab({ kpis, selectedId }: { kpis: LocationKPIs[]; selectedId: string | null }) {
  const selected = selectedId ? kpis.find((k) => k.locationId === selectedId) : null;

  if (!selected) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-lg font-medium text-gray-700 mb-1">Select a location above</p>
        <p className="text-sm">Click on any location card to view its detailed KPI breakdown.</p>
      </div>
    );
  }

  const sections = [
    {
      title: 'Production', icon: BarChart3,
      items: [
        { label: 'Daily Average', value: formatCurrency(selected.production.dailyAvg) },
        { label: 'Monthly Total', value: formatCurrency(selected.production.monthlyTotal) },
        { label: 'Per Provider', value: formatCurrency(selected.production.perProvider) },
        { label: 'Per Chair', value: formatCurrency(selected.production.perChair) },
      ],
    },
    {
      title: 'Collections', icon: Target,
      items: [
        { label: 'Total', value: formatCurrency(selected.collections.total) },
        { label: 'Rate', value: pct(selected.collections.rate) },
        { label: 'Days in AR', value: `${selected.collections.daysInAR} days` },
      ],
    },
    {
      title: 'Patients', icon: Users,
      items: [
        { label: 'Active', value: selected.patients.active.toLocaleString() },
        { label: 'New / Month', value: String(selected.patients.newPerMonth) },
        { label: 'Attrition Rate', value: pct(selected.patients.attritionRate) },
        { label: 'Avg Visits / Year', value: selected.patients.avgVisitsPerYear.toFixed(1) },
      ],
    },
    {
      title: 'Case Acceptance', icon: TrendingUp,
      items: [
        { label: 'Acceptance Rate', value: pct(selected.caseAcceptance.rate) },
        { label: 'Avg Plan Value', value: formatCurrency(selected.caseAcceptance.avgPlanValue) },
        { label: 'Conversion Rate', value: pct(selected.caseAcceptance.conversionRate) },
      ],
    },
    {
      title: 'Scheduling', icon: Building2,
      items: [
        { label: 'Chair Utilization', value: pct(selected.scheduling.chairUtilization) },
        { label: 'No-Show Rate', value: pct(selected.scheduling.noShowRate) },
        { label: 'Same-Day Cancel', value: pct(selected.scheduling.sameDayCancellation) },
      ],
    },
    {
      title: 'Revenue', icon: BarChart3,
      items: [
        { label: 'Per Patient', value: formatCurrency(selected.revenue.perPatient) },
        { label: 'Per Visit', value: formatCurrency(selected.revenue.perVisit) },
        { label: 'Hygiene %', value: pct(selected.revenue.hygieneRevenuePct) },
        { label: 'Restorative %', value: pct(selected.revenue.restorativeRevenuePct) },
      ],
    },
    {
      title: 'Staff', icon: Users,
      items: [
        { label: 'Providers', value: String(selected.staff.providers) },
        { label: 'Hygienists', value: String(selected.staff.hygienists) },
        { label: 'Support', value: String(selected.staff.support) },
        { label: 'FTEs', value: String(selected.staff.ftes) },
      ],
    },
    {
      title: 'Overhead', icon: AlertTriangle,
      items: [
        { label: 'Overhead Ratio', value: pct(selected.overhead.ratio) },
        { label: 'Supply Cost', value: pct(selected.overhead.supplyCostPct) },
        { label: 'Lab Cost', value: pct(selected.overhead.labCostPct) },
      ],
    },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-blue-600" />
        {selected.locationName} — Detailed KPIs
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((sec) => (
          <div key={sec.title} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium mb-3">
              <sec.icon className="w-4 h-4 text-blue-500" />
              {sec.title}
            </div>
            <div className="space-y-2">
              {sec.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Compare Tab ────────────────────────────────────────────────────────────

function CompareTab({ comparison }: { comparison: ComparisonData }) {
  const total = comparison.locations.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 sticky left-0 z-10 min-w-[140px]">Location</th>
              {comparison.kpis.map((kpi) => (
                <th key={kpi} className="text-center p-3 font-semibold text-gray-700 bg-gray-50 min-w-[120px]">{kpi}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.locations.map((loc) => (
              <tr key={loc.id} className="border-b border-gray-100 last:border-b-0">
                <td className="p-3 font-medium text-gray-900 bg-white sticky left-0 z-10">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    {loc.name}
                  </div>
                </td>
                {comparison.kpis.map((kpi) => {
                  const m = loc.metrics[kpi];
                  if (!m) return <td key={kpi} className="p-3 text-center">-</td>;
                  const inverted = isInvertedKPI(kpi);
                  const bgClass = heatmapColor(m.rank, total, inverted);
                  const isMonetary = kpi === 'Production' || kpi === 'Collections';
                  const isPct = kpi === 'Utilization' || kpi === 'Case Accept' || kpi === 'No-Show' || kpi === 'Overhead';
                  const isCount = kpi === 'Patients';
                  let display = String(m.value);
                  if (isMonetary && m.value > 1000) display = compactCurrency(m.value);
                  else if (isMonetary) display = formatCurrency(m.value);
                  else if (isPct) display = pct(m.value);
                  else if (isCount) display = m.value.toLocaleString();

                  return (
                    <td key={kpi} className={cn('p-3 text-center font-medium', bgClass)}>
                      <div>{display}</div>
                      <div className="text-xs mt-0.5 opacity-70">
                        #{m.rank} ({m.vsGroupAvg > 0 ? '+' : ''}{m.vsGroupAvg.toFixed(1)}%)
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Trends Tab ─────────────────────────────────────────────────────────────

function TrendsTab({ trends }: { trends: TrendsData }) {
  const [selectedKPI, setSelectedKPI] = useState<TrendKPI>('production');

  const chartData = trends.months.map((month, i) => {
    const point: Record<string, string | number> = { month };
    for (const loc of trends.locations) {
      point[loc.name] = loc.data[i]?.[selectedKPI] ?? 0;
    }
    return point;
  });

  const formatYAxis = (value: number) => {
    if (selectedKPI === 'production' || selectedKPI === 'collections') return compactCurrency(value);
    if (selectedKPI === 'utilization') return `${value}%`;
    return value.toLocaleString();
  };

  const formatTooltipValue = (value: number) => {
    if (selectedKPI === 'production' || selectedKPI === 'collections') return formatCurrency(value);
    if (selectedKPI === 'utilization') return pct(value);
    return value.toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          6-Month Trends
        </h3>
        <select
          value={selectedKPI}
          onChange={(e) => setSelectedKPI(e.target.value as TrendKPI)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {TREND_KPI_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatTooltipValue(value), name]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ paddingTop: '12px', fontSize: '13px' }}
          />
          {trends.locations.map((loc, i) => (
            <Line
              key={loc.id}
              type="monotone"
              dataKey={loc.name}
              stroke={LOCATION_COLORS[i]}
              strokeWidth={2}
              dot={{ r: 3, fill: LOCATION_COLORS[i] }}
              activeDot={{ r: 5, stroke: LOCATION_COLORS[i], strokeWidth: 2, fill: '#fff' }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Root Cause Tab ─────────────────────────────────────────────────────────

function RootCauseTab({
  locations,
  rootCauses,
}: {
  locations: Location[];
  rootCauses: Record<string, RootCauseData>;
}) {
  const [selectedLocId, setSelectedLocId] = useState(locations[0]?.id ?? '');
  const data = rootCauses[selectedLocId];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm font-medium text-gray-700">Location:</label>
        <select
          value={selectedLocId}
          onChange={(e) => setSelectedLocId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name} — {loc.city}</option>
          ))}
        </select>
      </div>

      {!data || data.underperformingAreas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          <Award className="w-12 h-12 mx-auto mb-3 text-green-300" />
          <p className="text-lg font-medium text-gray-700 mb-1">No underperforming areas</p>
          <p className="text-sm">This location is meeting or exceeding group averages across all KPIs.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.underperformingAreas.map((area) => {
            const gapSign = area.gap >= 0 ? '+' : '';
            const isMonetary = area.currentValue > 1000;
            const fmtVal = isMonetary ? formatCurrency(area.currentValue) : pct(area.currentValue);
            const fmtAvg = isMonetary ? formatCurrency(area.groupAvg) : pct(area.groupAvg);

            return (
              <div key={area.area} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      {area.area}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 text-sm">
                      <span className="text-gray-600">
                        Current: <span className="font-medium text-gray-900">{fmtVal}</span>
                      </span>
                      <span className="text-gray-600">
                        Group Avg: <span className="font-medium text-gray-900">{fmtAvg}</span>
                      </span>
                      <span className={cn(
                        'font-medium',
                        area.gap < 0 ? 'text-red-600' : 'text-amber-600'
                      )}>
                        Gap: {gapSign}{area.gap.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {area.gap < -10 ? (
                    <TrendingDown className="w-5 h-5 text-red-500 mt-0.5" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-amber-500 mt-0.5" />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Possible Causes</h5>
                    <ul className="space-y-1.5">
                      {area.possibleCauses.map((cause, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                          {cause}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h5>
                    <ul className="space-y-1.5">
                      {area.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          {priorityBadge(i)}
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Group Report Tab ───────────────────────────────────────────────────────

function GroupReportTab({ report, kpis }: { report: GroupReport; kpis: LocationKPIs[] }) {
  const healthColor =
    report.groupHealthScore >= 80 ? 'text-green-600' :
    report.groupHealthScore >= 60 ? 'text-yellow-600' : 'text-red-600';

  const healthBg =
    report.groupHealthScore >= 80 ? 'bg-green-50 border-green-200' :
    report.groupHealthScore >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

  return (
    <div className="space-y-6">
      {/* Health Score */}
      <div className={cn('rounded-xl border-2 p-8 text-center', healthBg)}>
        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Group Health Score</p>
        <p className={cn('text-6xl font-bold', healthColor)}>{report.groupHealthScore}</p>
        <p className="text-sm text-gray-500 mt-2">out of 100</p>
      </div>

      {/* Combined Financials */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Combined Financials
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">Metric</th>
                <th className="text-right p-3 font-semibold text-gray-700 bg-gray-50">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="p-3 text-gray-700">Total Production</td>
                <td className="p-3 text-right font-medium text-gray-900">{formatCurrency(report.totalProduction)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3 text-gray-700">Total Collections</td>
                <td className="p-3 text-right font-medium text-gray-900">{formatCurrency(report.totalCollections)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3 text-gray-700">Overall Collection Rate</td>
                <td className="p-3 text-right font-medium text-gray-900">{pct((report.totalCollections / report.totalProduction) * 100)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3 text-gray-700">Total Active Patients</td>
                <td className="p-3 text-right font-medium text-gray-900">{report.totalPatients.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="p-3 text-gray-700">Revenue Per Patient (Avg)</td>
                <td className="p-3 text-right font-medium text-gray-900">{formatCurrency(report.totalProduction / report.totalPatients)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Location Rankings */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          Location Rankings
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">Rank</th>
                <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">Location</th>
                <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50">Composite Score</th>
                <th className="text-right p-3 font-semibold text-gray-700 bg-gray-50">Production</th>
                <th className="text-right p-3 font-semibold text-gray-700 bg-gray-50">Collection Rate</th>
              </tr>
            </thead>
            <tbody>
              {report.locationRankings.map((loc) => {
                const locKPI = kpis.find((k) => k.locationId === loc.id);
                const isTop = loc.rank === 1;
                const isBottom = loc.rank === report.locationRankings.length;
                const rowBg = isTop
                  ? 'bg-yellow-50'
                  : isBottom
                    ? 'bg-red-50'
                    : '';

                return (
                  <tr key={loc.id} className={cn('border-b border-gray-100 last:border-b-0', rowBg)}>
                    <td className="p-3">
                      <span className={cn(
                        'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                        isTop ? 'bg-yellow-400 text-yellow-900' : isBottom ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-700'
                      )}>
                        {loc.rank}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {isTop && <Award className="w-4 h-4 text-yellow-500" />}
                        {loc.name}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded-full text-xs font-bold',
                        loc.score >= 80 ? 'bg-green-100 text-green-700' :
                        loc.score >= 70 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {loc.score}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium text-gray-900">
                      {locKPI ? formatCurrency(locKPI.production.monthlyTotal) : '-'}
                    </td>
                    <td className="p-3 text-right font-medium text-gray-900">
                      {locKPI ? pct(locKPI.collections.rate) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────

export default function MultiLocationPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const [dashboard, setDashboard] = useState<DashboardData>(MOCK_DASHBOARD);
  const [locations, setLocations] = useState<Location[]>(MOCK_LOCATIONS);
  const [kpis, setKpis] = useState<LocationKPIs[]>(MOCK_KPIS);
  const [comparison, setComparison] = useState<ComparisonData>(MOCK_COMPARISON);
  const [trends, setTrends] = useState<TrendsData>(MOCK_TRENDS);
  const [rootCauses, setRootCauses] = useState<Record<string, RootCauseData>>(MOCK_ROOT_CAUSES);
  const [groupReport, setGroupReport] = useState<GroupReport>(MOCK_GROUP_REPORT);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, locRes, kpiRes, compRes, trendRes, reportRes] = await Promise.allSettled([
        api.get('/multi-location/dashboard'),
        api.get('/multi-location'),
        api.get('/multi-location/kpis'),
        api.get('/multi-location/comparison'),
        api.get('/multi-location/trends'),
        api.get('/multi-location/group-report'),
      ]);

      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data);
      if (locRes.status === 'fulfilled') setLocations(locRes.value.data);
      if (kpiRes.status === 'fulfilled') setKpis(kpiRes.value.data);
      if (compRes.status === 'fulfilled') setComparison(compRes.value.data);
      if (trendRes.status === 'fulfilled') setTrends(trendRes.value.data);
      if (reportRes.status === 'fulfilled') setGroupReport(reportRes.value.data);

      const anyFailed = [dashRes, locRes, kpiRes, compRes, trendRes, reportRes].some(
        (r) => r.status === 'rejected'
      );
      if (anyFailed) {
        toast('Using demo data for some sections', { icon: '\u2139\ufe0f' });
      }
    } catch {
      toast('Using demo data — backend not available', { icon: '\u2139\ufe0f' });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRootCause = useCallback(async (locationId: string) => {
    try {
      const { data } = await api.get(`/locations/${locationId}/root-cause`);
      setRootCauses((prev) => ({ ...prev, [locationId]: data }));
    } catch {
      // keep mock fallback
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedLocationId) {
      fetchRootCause(selectedLocationId);
    }
  }, [selectedLocationId, fetchRootCause]);

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-600" />
            Multi-Location Intelligence
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cross-location benchmarking, trends, and actionable insights across all {dashboard.totalLocations} locations.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 font-medium">
            <Award className="w-4 h-4" />
            Top: {dashboard.topPerformer}
          </span>
          <span className="flex items-center gap-1.5 text-red-700 bg-red-50 px-3 py-1.5 rounded-full border border-red-200 font-medium">
            <AlertTriangle className="w-4 h-4" />
            Needs Attention: {dashboard.bottomPerformer}
          </span>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-indigo-900 mb-2">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
            <p className="text-xs text-indigo-800">Connect all your practice locations to pull in production, collections, and patient data automatically</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="text-xs text-indigo-800">View consolidated metrics across every site from one dashboard with real-time KPIs</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="text-xs text-indigo-800">Benchmark locations against each other to spot top performers and areas needing attention</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
            <p className="text-xs text-indigo-800">Share resources, staffing insights, and best practices across locations to lift the whole group</p>
          </div>
        </div>
      </div>

      {/* Group Summary Header */}
      <GroupSummaryHeader data={dashboard} />

      {/* Location Performance Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Location Performance</h2>
        <LocationPerformanceGrid
          locations={locations}
          kpis={kpis}
          selectedId={selectedLocationId}
          onSelect={setSelectedLocationId}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'Overview' && (
          <OverviewTab kpis={kpis} selectedId={selectedLocationId} />
        )}
        {activeTab === 'Compare' && (
          <CompareTab comparison={comparison} />
        )}
        {activeTab === 'Trends' && (
          <TrendsTab trends={trends} />
        )}
        {activeTab === 'Root Cause' && (
          <RootCauseTab locations={locations} rootCauses={rootCauses} />
        )}
        {activeTab === 'Group Report' && (
          <GroupReportTab report={groupReport} kpis={kpis} />
        )}
      </div>
    </div>
  );
}
