// ─── Role Definitions & Access Control ──────────────────────────────────────

export type DemoRole = 'notes' | 'frontDesk' | 'billing' | 'complete';

export interface RoleConfig {
  id: DemoRole;
  label: string;
  userName: string;
  userTitle: string;
  allowedRoutes: string[];
  summary: string;
}

const COMPLETE_ROUTES = [
  '/dashboard', '/morning-huddle', '/patients',
  '/notes', '/claim-scrubber', '/patient-retention', '/nurture-sequences',
  '/decision-support', '/treatment-plans', '/insurance', '/preauth',
  '/billing', '/payment-plans', '/fee-optimizer', '/recall', '/perio',
  '/smart-scheduling', '/communications', '/follow-ups', '/referrals',
  '/forms', '/inventory', '/procurement', '/reports', '/patient-scores',
  '/compliance', '/tools', '/settings',
];

export const ROLES: Record<DemoRole, RoleConfig> = {
  notes: {
    id: 'notes',
    label: 'Notes Package',
    userName: 'Notes Package Demo',
    userTitle: 'Clinical Documentation',
    summary: 'Clinical note drafting, SOAP-style review, treatment documentation, perio context, and provider approval workflows.',
    allowedRoutes: [
      '/dashboard', '/patients', '/notes', '/treatment-plans', '/perio', '/tools',
    ],
  },
  frontDesk: {
    id: 'frontDesk',
    label: 'Front Desk Package',
    userName: 'Front Desk Package Demo',
    userTitle: 'Patient Operations',
    summary: 'Scheduling, patient communication, recall, follow-ups, forms, morning huddle, and daily task visibility.',
    allowedRoutes: [
      '/dashboard', '/morning-huddle', '/patients',
      '/smart-scheduling', '/communications', '/follow-ups', '/recall', '/nurture-sequences',
      '/forms', '/patient-scores', '/tools',
    ],
  },
  billing: {
    id: 'billing',
    label: 'Billing Package',
    userName: 'Billing Package Demo',
    userTitle: 'Revenue Cycle Support',
    summary: 'Claim review, insurance eligibility, pre-auth tracking, billing queues, payment plans, and revenue reports.',
    allowedRoutes: [
      '/dashboard', '/patients', '/claim-scrubber', '/insurance', '/preauth',
      '/billing', '/payment-plans', '/fee-optimizer', '/reports', '/tools',
    ],
  },
  complete: {
    id: 'complete',
    label: 'Complete Package',
    userName: 'Complete Package Demo',
    userTitle: 'Full Practice Operating Layer',
    summary: 'Notes, front desk, billing, reporting, recall, clinical support, operations, and complete practice visibility.',
    allowedRoutes: COMPLETE_ROUTES,
  },
};

export function resolveRole(role: string | undefined | null): DemoRole {
  if (role === 'assistant' || role === 'office' || role === 'bronze') return 'frontDesk';
  if (role === 'silver') return 'billing';
  if (role === 'doctor' || role === 'gold') return 'complete';
  if (role && role in ROLES) return role as DemoRole;
  return 'complete';
}

export function isRouteAllowed(role: DemoRole, route: string): boolean {
  const config = ROLES[resolveRole(role)];
  return config.allowedRoutes.includes(route);
}

export function filterNavItems<T extends { to: string }>(role: DemoRole, items: T[]): T[] {
  const config = ROLES[resolveRole(role)];
  return items.filter((item) => config.allowedRoutes.includes(item.to));
}
