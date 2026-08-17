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

/**
 * The one code that opens the demo.
 *
 * Exported because the sign-in screen prints it and pre-fills the field. Every
 * call to action on the marketing site says "No signup. Nothing to install."
 * and points here; a code box with no way to learn the code made that promise
 * false and turned the page's only conversion path into a dead end. This is a
 * public demo, not a credential — there is nothing behind it but seeded data.
 */
export const DEMO_CODE = 'demo';

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
  // The prerender pass runs this in Node, which has no usable localStorage —
  // and the catch below reaches for it too, so without this the failure escapes
  // the try rather than being swallowed by it. Nobody is signed in while the
  // build generates static HTML, so the honest answer during prerender is the
  // same as for a first-time visitor.
  //
  // Tested by calling the method rather than by `typeof localStorage`: Node 22
  // and later define the global as a stub that throws unless the runtime was
  // started with a backing file, so the binding exists while the API does not.
  if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
    return null;
  }

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
