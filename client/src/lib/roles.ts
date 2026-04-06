// ─── Role Definitions & Access Control ──────────────────────────────────────

export type DemoRole = 'doctor' | 'office' | 'assistant';

export interface RoleConfig {
  id: DemoRole;
  label: string;
  userName: string;
  userTitle: string;
  allowedRoutes: string[];
}

const ALL_ROUTES = [
  '/dashboard', '/morning-huddle', '/patients',
  '/notes', '/claim-scrubber', '/patient-retention', '/nurture-sequences',
  '/decision-support', '/treatment-plans', '/insurance', '/preauth',
  '/billing', '/payment-plans', '/fee-optimizer', '/recall', '/perio',
  '/smart-scheduling', '/communications', '/follow-ups', '/referrals',
  '/forms', '/inventory', '/procurement', '/reports', '/patient-scores',
  '/compliance', '/multi-location', '/tools', '/settings',
];

export const ROLES: Record<DemoRole, RoleConfig> = {
  doctor: {
    id: 'doctor',
    label: 'Doctor View',
    userName: 'Dr. Sarah Mitchell',
    userTitle: 'Dentist',
    allowedRoutes: ALL_ROUTES,
  },
  office: {
    id: 'office',
    label: 'Office View',
    userName: 'Jessica Torres',
    userTitle: 'Office Manager',
    allowedRoutes: [
      '/dashboard', '/morning-huddle', '/patients',
      '/claim-scrubber', '/patient-retention', '/nurture-sequences',
      '/treatment-plans', '/insurance', '/preauth',
      '/billing', '/payment-plans', '/recall',
      '/smart-scheduling', '/communications', '/follow-ups', '/referrals',
      '/forms', '/inventory', '/procurement', '/reports', '/patient-scores',
      '/compliance', '/tools',
    ],
  },
  assistant: {
    id: 'assistant',
    label: 'Assistant View',
    userName: 'Maria Santos',
    userTitle: 'Dental Assistant',
    allowedRoutes: [
      '/dashboard', '/morning-huddle',
      '/smart-scheduling', '/communications', '/follow-ups',
      '/forms', '/inventory', '/procurement', '/compliance', '/tools',
    ],
  },
};

export function resolveRole(role: string | undefined | null): DemoRole {
  if (role && role in ROLES) return role as DemoRole;
  return 'doctor';
}

export function isRouteAllowed(role: DemoRole, route: string): boolean {
  const config = ROLES[resolveRole(role)];
  return config.allowedRoutes.includes(route);
}

export function filterNavItems<T extends { to: string }>(role: DemoRole, items: T[]): T[] {
  const config = ROLES[resolveRole(role)];
  return items.filter((item) => config.allowedRoutes.includes(item.to));
}
