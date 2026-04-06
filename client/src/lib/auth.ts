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
  name: 'Dr. Sarah Mitchell',
  email: 'demo@smartdentalai.com',
  role: 'doctor',
  office: 'Bright Smiles Dental',
};

const DEMO_CREDENTIALS = {
  email: 'demo@smartdentalai.com',
  password: 'demo',
};

export function login(email: string, password: string): { success: boolean; error?: string } {
  if (
    email.toLowerCase() === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password
  ) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USER));
    return { success: true };
  }
  return { success: false, error: 'Invalid email or password.' };
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getUser() !== null;
}

export function getDemoRole(): DemoRole {
  try {
    const raw = localStorage.getItem(ROLE_KEY);
    if (raw && (raw === 'doctor' || raw === 'office' || raw === 'assistant')) {
      return raw;
    }
  } catch { /* ignore */ }
  return 'doctor';
}

export function switchDemoRole(role: DemoRole): AuthUser {
  const config = ROLES[role];
  const user: AuthUser = {
    id: `demo-${role}`,
    name: config.userName,
    email: 'demo@smartdentalai.com',
    role,
    office: 'Bright Smiles Dental',
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(ROLE_KEY, role);
  return user;
}
