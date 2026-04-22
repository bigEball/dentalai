// ─── Role Definitions & Access Control ──────────────────────────────────────

export type DemoRole = 'bronze' | 'silver' | 'gold';

export interface RoleConfig {
  id: DemoRole;
  label: string;
  userName: string;
  userTitle: string;
  allowedRoutes: string[];
  summary: string;
}

const ALL_ROUTES = [
  '/dashboard', '/morning-huddle', '/patients',
  '/notes', '/claim-scrubber', '/patient-retention', '/nurture-sequences',
  '/decision-support', '/treatment-plans', '/insurance', '/preauth',
  '/billing', '/payment-plans', '/fee-optimizer', '/recall', '/perio',
  '/smart-scheduling', '/communications', '/follow-ups', '/referrals',
  '/forms', '/inventory', '/procurement', '/reports', '/patient-scores',
  '/compliance', '/ai-assistant', '/tools', '/settings',
];

export const ROLES: Record<DemoRole, RoleConfig> = {
  bronze: {
    id: 'bronze',
    label: 'Bronze Tier',
    userName: 'Bronze Tier Demo',
    userTitle: 'Core Operations',
    summary: 'Front desk automation, scheduling, patient communication, forms, inventory, and compliance.',
    allowedRoutes: [
      '/dashboard', '/morning-huddle', '/patients',
      '/smart-scheduling', '/communications', '/follow-ups',
      '/forms', '/inventory', '/compliance', '/tools',
      '/ai-assistant',
    ],
  },
  silver: {
    id: 'silver',
    label: 'Silver Tier',
    userName: 'Silver Tier Demo',
    userTitle: 'Revenue Operations',
    summary: 'Everything in Bronze, plus billing, recall, treatment follow-up, reports, referrals, inventory management, patient retention, and patient scoring.',
    allowedRoutes: [
      '/dashboard', '/morning-huddle', '/patients',
      '/patient-retention', '/nurture-sequences',
      '/treatment-plans',
      '/billing', '/payment-plans', '/recall',
      '/smart-scheduling', '/communications', '/follow-ups', '/referrals',
      '/forms', '/inventory', '/procurement', '/reports', '/patient-scores',
      '/compliance', '/tools',
      '/ai-assistant',
    ],
  },
  gold: {
    id: 'gold',
    label: 'Gold Tier',
    userName: 'Gold Tier Demo',
    userTitle: 'Complete AI Platform',
    summary: 'Everything in Silver, plus insurance tools, clinical AI notes, decision support, perio charting, fee optimization, and full system configuration.',
    allowedRoutes: ALL_ROUTES,
  },
};

export function resolveRole(role: string | undefined | null): DemoRole {
  if (role === 'assistant') return 'bronze';
  if (role === 'office') return 'silver';
  if (role === 'doctor') return 'gold';
  if (role && role in ROLES) return role as DemoRole;
  return 'gold';
}

export function isRouteAllowed(role: DemoRole, route: string): boolean {
  const config = ROLES[resolveRole(role)];
  return config.allowedRoutes.includes(route);
}

export function filterNavItems<T extends { to: string }>(role: DemoRole, items: T[]): T[] {
  const config = ROLES[resolveRole(role)];
  return items.filter((item) => config.allowedRoutes.includes(item.to));
}
