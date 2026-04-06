// ─── Multi-Location Intelligence Layer ──────────────────────────────────────
// In-memory data store for DSO multi-location analytics

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  chairs: number;
  providers: number;
  pms: string;
  openedDate: string;
  status: 'active' | 'onboarding' | 'closed';
}

export interface LocationKPIs {
  locationId: string;
  period: string;
  production: {
    dailyAvg: number;
    monthlyTotal: number;
    perProviderAvg: number;
    perChairAvg: number;
  };
  collections: {
    total: number;
    collectionRate: number;
    daysInAR: number;
  };
  patients: {
    activeCount: number;
    newPatientsPerMonth: number;
    attritionRate: number;
    avgVisitsPerYear: number;
  };
  caseAcceptance: {
    rate: number;
    avgTreatmentPlanValue: number;
    conversionRate: number;
  };
  scheduling: {
    chairUtilization: number;
    noShowRate: number;
    sameDayCancellationRate: number;
  };
  revenue: {
    perPatientAvg: number;
    perVisitAvg: number;
    hygieneRevenuePct: number;
    restorativeRevenuePct: number;
  };
  staff: {
    providers: number;
    hygienists: number;
    supportStaff: number;
    ftes: number;
  };
  overhead: {
    overheadRatio: number;
    supplyCostPct: number;
    labCostPct: number;
  };
}

export interface BenchmarkEntry {
  kpi: string;
  category: string;
  groupAverage: number;
  locations: {
    locationId: string;
    locationName: string;
    value: number;
    percentileRank: number;
    vsGroupAvg: number;
    flagged: boolean;
  }[];
  topPerformer: { locationId: string; locationName: string; value: number };
  bottomPerformer: { locationId: string; locationName: string; value: number };
}

export interface RootCauseInsight {
  area: string;
  severity: 'critical' | 'warning' | 'info';
  finding: string;
  possibleCauses: string[];
  recommendations: string[];
}

export interface GroupReport {
  generatedAt: string;
  totalLocations: number;
  combinedProduction: number;
  combinedCollections: number;
  groupCollectionRate: number;
  totalActivePatients: number;
  totalNewPatientsPerMonth: number;
  totalProviders: number;
  totalChairs: number;
  groupOverheadRatio: number;
  locationRankings: {
    locationId: string;
    locationName: string;
    performanceScore: number;
    productionRank: number;
    collectionsRank: number;
    growthRank: number;
  }[];
  groupHealthScore: number;
  highlights: string[];
  concerns: string[];
}

export interface DashboardData {
  summary: {
    totalLocations: number;
    combinedMonthlyProduction: number;
    groupCollectionRate: number;
    avgPatientCount: number;
    totalActivePatients: number;
  };
  locationCards: {
    locationId: string;
    name: string;
    city: string;
    production: number;
    collectionRate: number;
    chairUtilization: number;
    caseAcceptance: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  alerts: {
    locationId: string;
    locationName: string;
    type: string;
    message: string;
    severity: 'critical' | 'warning' | 'info';
  }[];
}

export interface TrendPoint {
  month: string;
  locationId: string;
  locationName: string;
  production: number;
  collectionRate: number;
  chairUtilization: number;
  caseAcceptance: number;
  newPatients: number;
  noShowRate: number;
}

// ─── Pre-populated locations ────────────────────────────────────────────────

const locations: Location[] = [
  {
    id: 'loc-001',
    name: 'Bright Smiles Downtown',
    address: '120 Main St, Suite 200',
    city: 'Denver',
    state: 'CO',
    zip: '80202',
    phone: '(303) 555-0101',
    chairs: 3,
    providers: 2,
    pms: 'Dentrix',
    openedDate: '2018-03-15',
    status: 'active',
  },
  {
    id: 'loc-002',
    name: 'Bright Smiles Westside',
    address: '4500 W Colfax Ave',
    city: 'Lakewood',
    state: 'CO',
    zip: '80215',
    phone: '(303) 555-0202',
    chairs: 4,
    providers: 3,
    pms: 'Eaglesoft',
    openedDate: '2019-06-01',
    status: 'active',
  },
  {
    id: 'loc-003',
    name: 'Bright Smiles Northpark',
    address: '8700 N Broadway',
    city: 'Thornton',
    state: 'CO',
    zip: '80229',
    phone: '(303) 555-0303',
    chairs: 3,
    providers: 2,
    pms: 'Open Dental',
    openedDate: '2020-01-10',
    status: 'active',
  },
  {
    id: 'loc-004',
    name: 'Bright Smiles Lakewood',
    address: '1200 S Wadsworth Blvd',
    city: 'Lakewood',
    state: 'CO',
    zip: '80232',
    phone: '(303) 555-0404',
    chairs: 5,
    providers: 3,
    pms: 'Dentrix',
    openedDate: '2019-09-20',
    status: 'active',
  },
  {
    id: 'loc-005',
    name: 'Bright Smiles Eastgate',
    address: '15600 E Colfax Ave',
    city: 'Aurora',
    state: 'CO',
    zip: '80011',
    phone: '(720) 555-0505',
    chairs: 2,
    providers: 1,
    pms: 'Open Dental',
    openedDate: '2024-08-01',
    status: 'active',
  },
];

// ─── KPI data per location (realistic mock) ─────────────────────────────────

const locationKPIs: Record<string, LocationKPIs> = {
  // Downtown: high production, high overhead, high new patients (urban)
  'loc-001': {
    locationId: 'loc-001',
    period: 'monthly',
    production: {
      dailyAvg: 6800,
      monthlyTotal: 142800,
      perProviderAvg: 71400,
      perChairAvg: 47600,
    },
    collections: {
      total: 131376,
      collectionRate: 92.0,
      daysInAR: 38,
    },
    patients: {
      activeCount: 1850,
      newPatientsPerMonth: 42,
      attritionRate: 8.5,
      avgVisitsPerYear: 2.8,
    },
    caseAcceptance: {
      rate: 62,
      avgTreatmentPlanValue: 2800,
      conversionRate: 55,
    },
    scheduling: {
      chairUtilization: 82,
      noShowRate: 9,
      sameDayCancellationRate: 6,
    },
    revenue: {
      perPatientAvg: 850,
      perVisitAvg: 310,
      hygieneRevenuePct: 28,
      restorativeRevenuePct: 42,
    },
    staff: {
      providers: 2,
      hygienists: 2,
      supportStaff: 3,
      ftes: 7,
    },
    overhead: {
      overheadRatio: 72,
      supplyCostPct: 8.5,
      labCostPct: 11,
    },
  },

  // Westside: balanced performance, best case acceptance
  'loc-002': {
    locationId: 'loc-002',
    period: 'monthly',
    production: {
      dailyAvg: 7200,
      monthlyTotal: 151200,
      perProviderAvg: 50400,
      perChairAvg: 37800,
    },
    collections: {
      total: 144648,
      collectionRate: 95.7,
      daysInAR: 28,
    },
    patients: {
      activeCount: 2200,
      newPatientsPerMonth: 35,
      attritionRate: 5.2,
      avgVisitsPerYear: 3.1,
    },
    caseAcceptance: {
      rate: 78,
      avgTreatmentPlanValue: 2400,
      conversionRate: 72,
    },
    scheduling: {
      chairUtilization: 88,
      noShowRate: 5,
      sameDayCancellationRate: 3,
    },
    revenue: {
      perPatientAvg: 780,
      perVisitAvg: 275,
      hygieneRevenuePct: 32,
      restorativeRevenuePct: 38,
    },
    staff: {
      providers: 3,
      hygienists: 3,
      supportStaff: 4,
      ftes: 10,
    },
    overhead: {
      overheadRatio: 63,
      supplyCostPct: 6.8,
      labCostPct: 9.5,
    },
  },

  // Northpark: lower production, low overhead, good patient retention
  'loc-003': {
    locationId: 'loc-003',
    period: 'monthly',
    production: {
      dailyAvg: 4900,
      monthlyTotal: 102900,
      perProviderAvg: 51450,
      perChairAvg: 34300,
    },
    collections: {
      total: 99801,
      collectionRate: 97.0,
      daysInAR: 22,
    },
    patients: {
      activeCount: 1400,
      newPatientsPerMonth: 18,
      attritionRate: 3.1,
      avgVisitsPerYear: 3.4,
    },
    caseAcceptance: {
      rate: 70,
      avgTreatmentPlanValue: 1950,
      conversionRate: 65,
    },
    scheduling: {
      chairUtilization: 76,
      noShowRate: 4,
      sameDayCancellationRate: 2,
    },
    revenue: {
      perPatientAvg: 720,
      perVisitAvg: 240,
      hygieneRevenuePct: 36,
      restorativeRevenuePct: 34,
    },
    staff: {
      providers: 2,
      hygienists: 2,
      supportStaff: 2,
      ftes: 6,
    },
    overhead: {
      overheadRatio: 58,
      supplyCostPct: 5.9,
      labCostPct: 8.2,
    },
  },

  // Lakewood: highest production (most chairs), but high no-show rate and lower collections
  'loc-004': {
    locationId: 'loc-004',
    period: 'monthly',
    production: {
      dailyAvg: 9100,
      monthlyTotal: 191100,
      perProviderAvg: 63700,
      perChairAvg: 38220,
    },
    collections: {
      total: 168168,
      collectionRate: 88.0,
      daysInAR: 48,
    },
    patients: {
      activeCount: 2600,
      newPatientsPerMonth: 38,
      attritionRate: 9.8,
      avgVisitsPerYear: 2.5,
    },
    caseAcceptance: {
      rate: 58,
      avgTreatmentPlanValue: 3200,
      conversionRate: 48,
    },
    scheduling: {
      chairUtilization: 74,
      noShowRate: 14,
      sameDayCancellationRate: 9,
    },
    revenue: {
      perPatientAvg: 810,
      perVisitAvg: 295,
      hygieneRevenuePct: 25,
      restorativeRevenuePct: 45,
    },
    staff: {
      providers: 3,
      hygienists: 3,
      supportStaff: 5,
      ftes: 11,
    },
    overhead: {
      overheadRatio: 68,
      supplyCostPct: 7.8,
      labCostPct: 10.5,
    },
  },

  // Eastgate: newest location, lowest numbers, high growth rate
  'loc-005': {
    locationId: 'loc-005',
    period: 'monthly',
    production: {
      dailyAvg: 3200,
      monthlyTotal: 67200,
      perProviderAvg: 67200,
      perChairAvg: 33600,
    },
    collections: {
      total: 62496,
      collectionRate: 93.0,
      daysInAR: 32,
    },
    patients: {
      activeCount: 620,
      newPatientsPerMonth: 28,
      attritionRate: 4.5,
      avgVisitsPerYear: 2.9,
    },
    caseAcceptance: {
      rate: 66,
      avgTreatmentPlanValue: 2100,
      conversionRate: 58,
    },
    scheduling: {
      chairUtilization: 68,
      noShowRate: 7,
      sameDayCancellationRate: 5,
    },
    revenue: {
      perPatientAvg: 680,
      perVisitAvg: 260,
      hygieneRevenuePct: 30,
      restorativeRevenuePct: 40,
    },
    staff: {
      providers: 1,
      hygienists: 1,
      supportStaff: 2,
      ftes: 4,
    },
    overhead: {
      overheadRatio: 75,
      supplyCostPct: 9.2,
      labCostPct: 12,
    },
  },
};

// ─── 6-month trend data ─────────────────────────────────────────────────────

function generateTrends(): TrendPoint[] {
  const months = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04'];
  const trends: TrendPoint[] = [];

  const baseData: Record<string, {
    prodBase: number; prodGrowth: number;
    colBase: number; colGrowth: number;
    chairBase: number; chairGrowth: number;
    caseBase: number; caseGrowth: number;
    newPatBase: number; newPatGrowth: number;
    noShowBase: number; noShowGrowth: number;
  }> = {
    'loc-001': { prodBase: 128000, prodGrowth: 2500, colBase: 90.5, colGrowth: 0.3, chairBase: 78, chairGrowth: 0.7, caseBase: 58, caseGrowth: 0.7, newPatBase: 36, newPatGrowth: 1, noShowBase: 10.5, noShowGrowth: -0.25 },
    'loc-002': { prodBase: 140000, prodGrowth: 1800, colBase: 94.2, colGrowth: 0.25, chairBase: 85, chairGrowth: 0.5, caseBase: 73, caseGrowth: 0.8, newPatBase: 30, newPatGrowth: 0.8, noShowBase: 6, noShowGrowth: -0.15 },
    'loc-003': { prodBase: 96000, prodGrowth: 1200, colBase: 95.8, colGrowth: 0.2, chairBase: 72, chairGrowth: 0.7, caseBase: 67, caseGrowth: 0.5, newPatBase: 15, newPatGrowth: 0.5, noShowBase: 5, noShowGrowth: -0.15 },
    'loc-004': { prodBase: 175000, prodGrowth: 2800, colBase: 86.0, colGrowth: 0.35, chairBase: 70, chairGrowth: 0.7, caseBase: 54, caseGrowth: 0.6, newPatBase: 32, newPatGrowth: 1, noShowBase: 16, noShowGrowth: -0.35 },
    'loc-005': { prodBase: 45000, prodGrowth: 4000, colBase: 90.0, colGrowth: 0.5, chairBase: 58, chairGrowth: 1.7, caseBase: 60, caseGrowth: 1.0, newPatBase: 18, newPatGrowth: 1.8, noShowBase: 9, noShowGrowth: -0.35 },
  };

  for (const loc of locations) {
    const d = baseData[loc.id];
    months.forEach((month, i) => {
      // Add some randomness to make it realistic
      const jitter = () => (Math.random() - 0.5) * 0.04; // +/- 2%
      trends.push({
        month,
        locationId: loc.id,
        locationName: loc.name,
        production: Math.round(d.prodBase + d.prodGrowth * i * (1 + jitter())),
        collectionRate: Math.round((d.colBase + d.colGrowth * i + jitter() * 2) * 10) / 10,
        chairUtilization: Math.round((d.chairBase + d.chairGrowth * i + jitter() * 3) * 10) / 10,
        caseAcceptance: Math.round((d.caseBase + d.caseGrowth * i + jitter() * 3) * 10) / 10,
        newPatients: Math.round(d.newPatBase + d.newPatGrowth * i + (Math.random() - 0.5) * 3),
        noShowRate: Math.round(Math.max(1, d.noShowBase + d.noShowGrowth * i + jitter() * 2) * 10) / 10,
      });
    });
  }

  return trends;
}

// Freeze the trends so they don't change on every call (seeded once at startup)
const trendData: TrendPoint[] = generateTrends();

// ─── Helper: percentile rank ────────────────────────────────────────────────

function percentileRank(values: number[], target: number, higherIsBetter = true): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = sorted.indexOf(target);
  const rank = ((idx + 1) / sorted.length) * 100;
  return higherIsBetter ? rank : 100 - rank + (100 / sorted.length);
}

// ─── Exported functions ─────────────────────────────────────────────────────

export function getLocations(): Location[] {
  return locations;
}

export function getLocationById(id: string): Location | undefined {
  return locations.find((l) => l.id === id);
}

export function getLocationKPIs(locationId: string): LocationKPIs | undefined {
  return locationKPIs[locationId];
}

export function getAllLocationKPIs(): LocationKPIs[] {
  return locations.map((loc) => locationKPIs[loc.id]);
}

export function getComparison(): BenchmarkEntry[] {
  const allKPIs = getAllLocationKPIs();
  const benchmarks: BenchmarkEntry[] = [];

  // Define which KPIs to benchmark and whether higher is better
  const kpiDefs: { key: string; category: string; label: string; extract: (k: LocationKPIs) => number; higherIsBetter: boolean }[] = [
    { key: 'monthlyProduction', category: 'Production', label: 'Monthly Production', extract: (k) => k.production.monthlyTotal, higherIsBetter: true },
    { key: 'perProviderAvg', category: 'Production', label: 'Production per Provider', extract: (k) => k.production.perProviderAvg, higherIsBetter: true },
    { key: 'perChairAvg', category: 'Production', label: 'Production per Chair', extract: (k) => k.production.perChairAvg, higherIsBetter: true },
    { key: 'collectionRate', category: 'Collections', label: 'Collection Rate %', extract: (k) => k.collections.collectionRate, higherIsBetter: true },
    { key: 'daysInAR', category: 'Collections', label: 'Days in A/R', extract: (k) => k.collections.daysInAR, higherIsBetter: false },
    { key: 'newPatientsPerMonth', category: 'Patients', label: 'New Patients/Month', extract: (k) => k.patients.newPatientsPerMonth, higherIsBetter: true },
    { key: 'attritionRate', category: 'Patients', label: 'Patient Attrition %', extract: (k) => k.patients.attritionRate, higherIsBetter: false },
    { key: 'caseAcceptanceRate', category: 'Case Acceptance', label: 'Case Acceptance %', extract: (k) => k.caseAcceptance.rate, higherIsBetter: true },
    { key: 'conversionRate', category: 'Case Acceptance', label: 'Conversion Rate %', extract: (k) => k.caseAcceptance.conversionRate, higherIsBetter: true },
    { key: 'chairUtilization', category: 'Scheduling', label: 'Chair Utilization %', extract: (k) => k.scheduling.chairUtilization, higherIsBetter: true },
    { key: 'noShowRate', category: 'Scheduling', label: 'No-Show Rate %', extract: (k) => k.scheduling.noShowRate, higherIsBetter: false },
    { key: 'overheadRatio', category: 'Overhead', label: 'Overhead Ratio %', extract: (k) => k.overhead.overheadRatio, higherIsBetter: false },
    { key: 'revenuePerPatient', category: 'Revenue', label: 'Revenue per Patient', extract: (k) => k.revenue.perPatientAvg, higherIsBetter: true },
  ];

  for (const def of kpiDefs) {
    const values = allKPIs.map((k) => def.extract(k));
    const avg = values.reduce((s, v) => s + v, 0) / values.length;

    const locEntries = allKPIs.map((k) => {
      const value = def.extract(k);
      const loc = locations.find((l) => l.id === k.locationId)!;
      const vsAvg = ((value - avg) / avg) * 100;
      const flagged = def.higherIsBetter ? vsAvg < -15 : vsAvg > 15;

      return {
        locationId: k.locationId,
        locationName: loc.name,
        value,
        percentileRank: Math.round(percentileRank(values, value, def.higherIsBetter)),
        vsGroupAvg: Math.round(vsAvg * 10) / 10,
        flagged,
      };
    });

    const bestIdx = def.higherIsBetter
      ? values.indexOf(Math.max(...values))
      : values.indexOf(Math.min(...values));
    const worstIdx = def.higherIsBetter
      ? values.indexOf(Math.min(...values))
      : values.indexOf(Math.max(...values));

    benchmarks.push({
      kpi: def.label,
      category: def.category,
      groupAverage: Math.round(avg * 100) / 100,
      locations: locEntries,
      topPerformer: {
        locationId: allKPIs[bestIdx].locationId,
        locationName: locations.find((l) => l.id === allKPIs[bestIdx].locationId)!.name,
        value: values[bestIdx],
      },
      bottomPerformer: {
        locationId: allKPIs[worstIdx].locationId,
        locationName: locations.find((l) => l.id === allKPIs[worstIdx].locationId)!.name,
        value: values[worstIdx],
      },
    });
  }

  return benchmarks;
}

export function getRootCauseAnalysis(locationId: string): RootCauseInsight[] {
  const kpis = locationKPIs[locationId];
  if (!kpis) return [];

  const allKPIs = getAllLocationKPIs();
  const insights: RootCauseInsight[] = [];

  // Calculate group averages
  const avgCollectionRate = allKPIs.reduce((s, k) => s + k.collections.collectionRate, 0) / allKPIs.length;
  const avgCaseAcceptance = allKPIs.reduce((s, k) => s + k.caseAcceptance.rate, 0) / allKPIs.length;
  const avgNoShow = allKPIs.reduce((s, k) => s + k.scheduling.noShowRate, 0) / allKPIs.length;
  const avgChairUtil = allKPIs.reduce((s, k) => s + k.scheduling.chairUtilization, 0) / allKPIs.length;
  const avgOverhead = allKPIs.reduce((s, k) => s + k.overhead.overheadRatio, 0) / allKPIs.length;
  const avgAttrition = allKPIs.reduce((s, k) => s + k.patients.attritionRate, 0) / allKPIs.length;
  const avgDaysAR = allKPIs.reduce((s, k) => s + k.collections.daysInAR, 0) / allKPIs.length;

  // Low collection rate
  if (kpis.collections.collectionRate < avgCollectionRate * 0.9) {
    insights.push({
      area: 'Collection Rate',
      severity: kpis.collections.collectionRate < avgCollectionRate * 0.85 ? 'critical' : 'warning',
      finding: `Collection rate at ${kpis.collections.collectionRate}% is ${Math.round(((avgCollectionRate - kpis.collections.collectionRate) / avgCollectionRate) * 100)}% below group average of ${Math.round(avgCollectionRate * 10) / 10}%.`,
      possibleCauses: [
        `High A/R days (${kpis.collections.daysInAR} days vs group avg ${Math.round(avgDaysAR)}) suggests slow claim follow-up`,
        'Potential insurance verification gaps leading to claim denials',
        'Possible undercoding or incorrect fee schedule mapping in ' + locations.find((l) => l.id === locationId)?.pms,
        'Patient balance follow-up process may be inconsistent',
      ],
      recommendations: [
        'Implement daily A/R aging review — prioritize claims over 30 days',
        'Verify insurance eligibility before all scheduled appointments',
        'Audit denied claims from the past 90 days to identify patterns',
        'Set up automated patient balance reminders at 30/60/90 day intervals',
        'Review fee schedules for the top 20 procedure codes against payer contracts',
      ],
    });
  }

  // Low case acceptance
  if (kpis.caseAcceptance.rate < avgCaseAcceptance * 0.85) {
    insights.push({
      area: 'Case Acceptance',
      severity: kpis.caseAcceptance.rate < avgCaseAcceptance * 0.8 ? 'critical' : 'warning',
      finding: `Case acceptance rate at ${kpis.caseAcceptance.rate}% vs group average of ${Math.round(avgCaseAcceptance * 10) / 10}%. Conversion rate only ${kpis.caseAcceptance.conversionRate}%.`,
      possibleCauses: [
        'Treatment presentation may lack visual aids (intraoral photos, diagrams)',
        'Limited financial options being offered to patients',
        'Insufficient follow-up on pending treatment plans',
        'Provider chairside time for case discussion may be rushed',
      ],
      recommendations: [
        'Train treatment coordinators on co-discovery method and financial presentations',
        'Implement third-party financing (CareCredit, Sunbit) if not already offered',
        'Create a 48-hour follow-up protocol for all presented treatment plans over $500',
        'Use intraoral camera photos during every exam to improve patient understanding',
        'Track case acceptance by provider to identify coaching opportunities',
      ],
    });
  }

  // High no-show rate
  if (kpis.scheduling.noShowRate > avgNoShow * 1.3) {
    insights.push({
      area: 'No-Show Rate',
      severity: kpis.scheduling.noShowRate > avgNoShow * 1.5 ? 'critical' : 'warning',
      finding: `No-show rate at ${kpis.scheduling.noShowRate}% is significantly above group average of ${Math.round(avgNoShow * 10) / 10}%.`,
      possibleCauses: [
        'Confirmation process may rely on single-channel outreach only',
        'Appointment lead times may be too long, leading to patient disengagement',
        'Demographics of patient base may include higher transient population',
        'No structured consequence or re-engagement process for repeat no-shows',
      ],
      recommendations: [
        'Implement multi-channel appointment confirmations (text + email + phone for high-value)',
        'Send confirmations at 7 days, 2 days, and same-day morning',
        'Maintain a short-call list to fill same-day cancellations within 30 minutes',
        'Flag patients with 2+ no-shows and require pre-payment or same-day booking only',
        'Reduce scheduling lead time by opening more same-week availability',
      ],
    });
  }

  // Low chair utilization
  if (kpis.scheduling.chairUtilization < avgChairUtil * 0.85) {
    insights.push({
      area: 'Chair Utilization',
      severity: kpis.scheduling.chairUtilization < avgChairUtil * 0.8 ? 'critical' : 'warning',
      finding: `Chair utilization at ${kpis.scheduling.chairUtilization}% vs group average of ${Math.round(avgChairUtil * 10) / 10}%. Significant revenue potential being lost.`,
      possibleCauses: [
        'Scheduling template may not optimize for provider-hygiene handoff',
        'Front desk may be leaving buffer time between appointments unnecessarily',
        'Provider productivity issues — longer-than-average appointment times',
        'Hygiene schedule may not be running at full capacity',
      ],
      recommendations: [
        'Audit scheduling templates and implement block scheduling by procedure type',
        'Train front desk on "power scheduling" — filling high-value morning slots first',
        'Add a hygiene provider if chairs are available but hygiene is backlogged',
        'Implement same-day treatment for simple procedures identified during exams',
        'Review provider time-per-procedure and identify efficiency opportunities',
      ],
    });
  }

  // High overhead ratio
  if (kpis.overhead.overheadRatio > avgOverhead * 1.15) {
    insights.push({
      area: 'Overhead',
      severity: kpis.overhead.overheadRatio > avgOverhead * 1.2 ? 'critical' : 'warning',
      finding: `Overhead ratio at ${kpis.overhead.overheadRatio}% exceeds group average of ${Math.round(avgOverhead * 10) / 10}%.`,
      possibleCauses: [
        `Supply costs at ${kpis.overhead.supplyCostPct}% may indicate over-ordering or premium pricing`,
        `Lab costs at ${kpis.overhead.labCostPct}% suggest potential lab fee renegotiation needed`,
        'Staffing levels may not align with current production levels',
        'Facility costs (rent, utilities) may be high relative to revenue',
      ],
      recommendations: [
        'Conduct supply cost audit — compare top 20 items against group purchasing rates',
        'Request competitive bids from 2-3 dental labs for crown and bridge work',
        'Review staffing ratios against production — target 25% staff cost to collections',
        'Negotiate supply contracts through group purchasing organization (GPO)',
        'Implement supply ordering controls with par levels and approval thresholds',
      ],
    });
  }

  // High attrition
  if (kpis.patients.attritionRate > avgAttrition * 1.3) {
    insights.push({
      area: 'Patient Attrition',
      severity: kpis.patients.attritionRate > avgAttrition * 1.5 ? 'critical' : 'warning',
      finding: `Patient attrition rate at ${kpis.patients.attritionRate}% vs group average of ${Math.round(avgAttrition * 10) / 10}%. Losing patients faster than acquiring them long-term.`,
      possibleCauses: [
        'Patient experience issues — long wait times, poor communication',
        'Lack of recall/reactivation system for lapsed patients',
        'Insurance network changes may be causing patient churn',
        'Online reviews may be below competitors in the area',
      ],
      recommendations: [
        'Survey recent lost patients to identify common dissatisfaction themes',
        'Implement automated recall outreach at 6, 9, and 12-month marks',
        'Monitor and respond to Google/Yelp reviews within 24 hours',
        'Audit patient wait times and target under 10 minutes from arrival to chair',
        'Create a "welcome back" incentive program for lapsed patients',
      ],
    });
  }

  // High days in A/R
  if (kpis.collections.daysInAR > avgDaysAR * 1.3) {
    insights.push({
      area: 'Accounts Receivable',
      severity: kpis.collections.daysInAR > avgDaysAR * 1.5 ? 'critical' : 'warning',
      finding: `Days in A/R at ${kpis.collections.daysInAR} vs group average of ${Math.round(avgDaysAR)}. Cash flow is being impacted.`,
      possibleCauses: [
        'Claims may not be submitted within 24 hours of service',
        'Insufficient follow-up on insurance company non-responses',
        'Patient statements may not be sent consistently',
        'Lack of dedicated billing staff or unclear billing workflows',
      ],
      recommendations: [
        'Establish same-day claim submission as a non-negotiable standard',
        'Assign daily insurance follow-up tasks for all claims over 21 days',
        'Implement automated patient statement cycle (every 30 days)',
        'Consider outsourcing complex claim appeals to a dental billing service',
        'Run weekly A/R aging reports and review in staff huddles',
      ],
    });
  }

  // If no issues found, add a positive note
  if (insights.length === 0) {
    insights.push({
      area: 'Overall Performance',
      severity: 'info',
      finding: 'This location is performing at or above group averages across all major KPIs. No significant underperformance detected.',
      possibleCauses: [],
      recommendations: [
        'Continue current operational practices',
        'Consider sharing best practices with underperforming locations',
        'Set stretch goals 5-10% above current performance levels',
      ],
    });
  }

  return insights;
}

export function getGroupReport(): GroupReport {
  const allKPIs = getAllLocationKPIs();

  const combinedProduction = allKPIs.reduce((s, k) => s + k.production.monthlyTotal, 0);
  const combinedCollections = allKPIs.reduce((s, k) => s + k.collections.total, 0);
  const groupCollectionRate = Math.round((combinedCollections / combinedProduction) * 1000) / 10;
  const totalActivePatients = allKPIs.reduce((s, k) => s + k.patients.activeCount, 0);
  const totalNewPatients = allKPIs.reduce((s, k) => s + k.patients.newPatientsPerMonth, 0);
  const totalProviders = allKPIs.reduce((s, k) => s + k.staff.providers, 0);
  const totalChairs = locations.reduce((s, l) => s + l.chairs, 0);
  const groupOverhead = Math.round((allKPIs.reduce((s, k) => s + k.overhead.overheadRatio, 0) / allKPIs.length) * 10) / 10;

  // Calculate performance score per location (weighted composite)
  const scores = allKPIs.map((k) => {
    const loc = locations.find((l) => l.id === k.locationId)!;
    // Weighted: production 25%, collections 20%, case acceptance 15%, chair util 15%, overhead 10%, growth 15%
    const prodScore = Math.min(100, (k.production.monthlyTotal / 200000) * 100);
    const colScore = k.collections.collectionRate;
    const caseScore = k.caseAcceptance.rate;
    const chairScore = k.scheduling.chairUtilization;
    const overheadScore = Math.max(0, 100 - k.overhead.overheadRatio);
    const growthScore = Math.min(100, (k.patients.newPatientsPerMonth / 50) * 100);

    const composite = Math.round(
      prodScore * 0.25 +
      colScore * 0.20 +
      caseScore * 0.15 +
      chairScore * 0.15 +
      overheadScore * 0.10 +
      growthScore * 0.15
    );

    return { locationId: k.locationId, locationName: loc.name, score: composite, production: k.production.monthlyTotal, collections: k.collections.total, newPatients: k.patients.newPatientsPerMonth };
  });

  // Rank by different criteria
  const byProduction = [...scores].sort((a, b) => b.production - a.production);
  const byCollections = [...scores].sort((a, b) => b.collections - a.collections);
  const byGrowth = [...scores].sort((a, b) => b.newPatients - a.newPatients);
  const byScore = [...scores].sort((a, b) => b.score - a.score);

  const locationRankings = byScore.map((s) => ({
    locationId: s.locationId,
    locationName: s.locationName,
    performanceScore: s.score,
    productionRank: byProduction.findIndex((p) => p.locationId === s.locationId) + 1,
    collectionsRank: byCollections.findIndex((c) => c.locationId === s.locationId) + 1,
    growthRank: byGrowth.findIndex((g) => g.locationId === s.locationId) + 1,
  }));

  const groupHealthScore = Math.round(scores.reduce((s, sc) => s + sc.score, 0) / scores.length);

  const highlights: string[] = [
    `Group monthly production reached ${formatDollar(combinedProduction)} across ${locations.length} locations`,
    `${locations.find((l) => l.id === byScore[0].locationId)!.name} leads overall performance with a score of ${byScore[0].score}/100`,
    `Group collection rate of ${groupCollectionRate}% ${groupCollectionRate >= 93 ? 'exceeds' : 'approaches'} the 93% industry benchmark`,
    `${totalNewPatients} new patients acquired across all locations this month`,
  ];

  const concerns: string[] = [];
  for (const k of allKPIs) {
    const loc = locations.find((l) => l.id === k.locationId)!;
    if (k.collections.collectionRate < 90) {
      concerns.push(`${loc.name}: Collection rate at ${k.collections.collectionRate}% requires immediate attention`);
    }
    if (k.scheduling.noShowRate > 10) {
      concerns.push(`${loc.name}: No-show rate of ${k.scheduling.noShowRate}% is impacting chair utilization`);
    }
    if (k.overhead.overheadRatio > 70) {
      concerns.push(`${loc.name}: Overhead ratio at ${k.overhead.overheadRatio}% is above target of 65%`);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalLocations: locations.length,
    combinedProduction,
    combinedCollections,
    groupCollectionRate,
    totalActivePatients,
    totalNewPatientsPerMonth: totalNewPatients,
    totalProviders,
    totalChairs,
    groupOverheadRatio: groupOverhead,
    locationRankings,
    groupHealthScore,
    highlights,
    concerns,
  };
}

export function getDashboard(): DashboardData {
  const allKPIs = getAllLocationKPIs();
  const combinedProduction = allKPIs.reduce((s, k) => s + k.production.monthlyTotal, 0);
  const totalActivePatients = allKPIs.reduce((s, k) => s + k.patients.activeCount, 0);
  const avgPatientCount = Math.round(totalActivePatients / allKPIs.length);
  const groupCollectionRate = Math.round(
    (allKPIs.reduce((s, k) => s + k.collections.collectionRate, 0) / allKPIs.length) * 10
  ) / 10;

  // Determine trend per location by comparing first and last trend points
  const locationCards = locations.map((loc) => {
    const k = locationKPIs[loc.id];
    const locTrends = trendData.filter((t) => t.locationId === loc.id);
    const firstProd = locTrends[0]?.production ?? 0;
    const lastProd = locTrends[locTrends.length - 1]?.production ?? 0;
    const trend: 'up' | 'down' | 'stable' = lastProd > firstProd * 1.02 ? 'up' : lastProd < firstProd * 0.98 ? 'down' : 'stable';

    return {
      locationId: loc.id,
      name: loc.name,
      city: loc.city,
      production: k.production.monthlyTotal,
      collectionRate: k.collections.collectionRate,
      chairUtilization: k.scheduling.chairUtilization,
      caseAcceptance: k.caseAcceptance.rate,
      trend,
    };
  });

  // Generate alerts for underperforming areas
  const alerts: DashboardData['alerts'] = [];
  for (const k of allKPIs) {
    const loc = locations.find((l) => l.id === k.locationId)!;

    if (k.collections.collectionRate < 90) {
      alerts.push({ locationId: loc.id, locationName: loc.name, type: 'collections', message: `Collection rate at ${k.collections.collectionRate}% — below 90% threshold`, severity: 'critical' });
    }
    if (k.scheduling.noShowRate > 10) {
      alerts.push({ locationId: loc.id, locationName: loc.name, type: 'no-shows', message: `No-show rate at ${k.scheduling.noShowRate}% — above 10% threshold`, severity: 'critical' });
    }
    if (k.overhead.overheadRatio > 70) {
      alerts.push({ locationId: loc.id, locationName: loc.name, type: 'overhead', message: `Overhead ratio at ${k.overhead.overheadRatio}% — above 70% target`, severity: 'warning' });
    }
    if (k.scheduling.chairUtilization < 75) {
      alerts.push({ locationId: loc.id, locationName: loc.name, type: 'utilization', message: `Chair utilization at ${k.scheduling.chairUtilization}% — below 75% target`, severity: 'warning' });
    }
    if (k.patients.attritionRate > 8) {
      alerts.push({ locationId: loc.id, locationName: loc.name, type: 'attrition', message: `Patient attrition at ${k.patients.attritionRate}% — above 8% threshold`, severity: 'warning' });
    }
  }

  return {
    summary: {
      totalLocations: locations.length,
      combinedMonthlyProduction: combinedProduction,
      groupCollectionRate,
      avgPatientCount,
      totalActivePatients,
    },
    locationCards,
    alerts: alerts.sort((a, b) => (a.severity === 'critical' ? -1 : 1) - (b.severity === 'critical' ? -1 : 1)),
  };
}

export function getTrends(): TrendPoint[] {
  return trendData;
}

// ─── Utility ────────────────────────────────────────────────────────────────

function formatDollar(amount: number): string {
  return '$' + amount.toLocaleString('en-US');
}
