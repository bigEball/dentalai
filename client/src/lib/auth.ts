import type { DemoRole } from './roles';
import { ROLES } from './roles';

const STORAGE_KEY = 'dental_user';
const ROLE_KEY = 'dental_demo_role';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  office: string;
}

const DEMO_USER: AuthUser = {
  id: 'demo-user',
  name: 'Complete Package Demo',
  email: 'demo@summitaisoftware.com',
  role: 'complete',
  office: 'Summit Demo Practice',
};

const DEMO_CODE = 'demo';

export function login(code: string): { success: boolean; error?: string } {
  if (code === DEMO_CODE) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USER));
    return { success: true };
  }
  return { success: false, error: 'Invalid access code.' };
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    // Migrate stale sessions missing the role field or using the old persona views.
    if (!parsed.role || parsed.role === 'doctor' || parsed.role === 'gold') {
      parsed.role = 'complete';
      parsed.name = ROLES.complete.userName;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } else if (parsed.role === 'office' || parsed.role === 'bronze') {
      parsed.role = 'frontDesk';
      parsed.name = ROLES.frontDesk.userName;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } else if (parsed.role === 'assistant' || parsed.role === 'silver') {
      parsed.role = 'billing';
      parsed.name = ROLES.billing.userName;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getUser() !== null;
}

export function getDemoRole(): DemoRole {
  try {
    const raw = localStorage.getItem(ROLE_KEY);
    if (raw === 'doctor' || raw === 'gold') return 'complete';
    if (raw === 'office' || raw === 'bronze') return 'frontDesk';
    if (raw === 'assistant' || raw === 'silver') return 'billing';
    if (raw && raw in ROLES) return raw as DemoRole;
  } catch { /* ignore */ }
  return 'complete';
}

export function switchDemoRole(role: DemoRole): AuthUser {
  const config = ROLES[role];
  const user: AuthUser = {
    id: `demo-${role}`,
    name: config.userName,
    email: 'demo@summitaisoftware.com',
    role,
    office: 'Summit Demo Practice',
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(ROLE_KEY, role);
  return user;
}
