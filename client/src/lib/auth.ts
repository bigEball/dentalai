const STORAGE_KEY = 'dental_user';

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
  email: 'demo@dentalai.com',
  role: 'admin',
  office: 'Bright Smiles Dental',
};

const DEMO_CREDENTIALS = {
  email: 'demo@dentalai.com',
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
