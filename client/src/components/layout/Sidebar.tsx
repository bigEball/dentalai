import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  DollarSign,
  RefreshCw,
  Scan,
  Settings,
  LogOut,
  ClipboardList,
  Calendar,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  FileCheck,
  Bell,
  ArrowRightLeft,
  Package,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';
import { getSystemStatus } from '@/lib/api';
import type { SystemStatus } from '@/lib/api';

const MAIN_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
];

const AI_NAV = [
  { to: '/notes', label: 'AI Notes', icon: FileText },
  { to: '/treatment-plans', label: 'Treatment Plans', icon: ClipboardList },
  { to: '/insurance', label: 'Insurance', icon: Shield },
  { to: '/preauth', label: 'Pre-Auth', icon: ShieldCheck },
  { to: '/billing', label: 'Billing', icon: DollarSign },
  { to: '/payment-plans', label: 'Payment Plans', icon: CreditCard },
  { to: '/recall', label: 'Recall', icon: RefreshCw },
  { to: '/radiographs', label: 'Radiographs', icon: Scan },
  { to: '/perio', label: 'Perio Chart', icon: Activity },
];

const OFFICE_NAV = [
  { to: '/communications', label: 'Communications', icon: MessageSquare },
  { to: '/follow-ups', label: 'Follow-Ups', icon: Bell },
  { to: '/referrals', label: 'Referrals', icon: ArrowRightLeft },
  { to: '/forms', label: 'Patient Forms', icon: FileCheck },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

const SYSTEM_NAV = [
  { to: '/compliance', label: 'Compliance', icon: Shield },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function NavSection({ label, items }: { label: string; items: typeof MAIN_NAV }) {
  return (
    <div className="mb-5">
      <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
        {label}
      </p>
      <nav className="space-y-0.5">
        {items.map(({ to, label: itemLabel, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <Icon size={16} />
            {itemLabel}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    getSystemStatus()
      .then(setStatus)
      .catch(() => setStatus({ mode: 'demo', openDentalConnected: false, ollamaAvailable: false }));
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside
      className="fixed top-0 left-0 h-full w-64 flex flex-col z-40"
      style={{ backgroundColor: '#0f1117' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.jpg"
            alt="Smart Dental AI Services"
            className="h-9 w-9 rounded-lg object-cover flex-shrink-0"
          />
          <div>
            <p className="text-sm font-semibold text-white leading-none">Smart Dental AI</p>
            <p className="text-[10px] text-gray-500 mt-0.5">AI Operations Layer</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavSection label="Main" items={MAIN_NAV} />
        <NavSection label="AI Modules" items={AI_NAV} />
        <NavSection label="Office" items={OFFICE_NAV} />
        <NavSection label="System" items={SYSTEM_NAV} />
      </div>

      {/* Mode indicator */}
      {status && (
        <div className="px-4 pb-2">
          {status.mode === 'demo' ? (
            <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                Demo Mode
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">
                Live
              </span>
            </div>
          )}
        </div>
      )}

      {/* User */}
      <div className="px-3 pb-4 border-t border-white/5 pt-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-white">
              {user ? getInitials(user.name.split(' ')[0] ?? '', user.name.split(' ')[1] ?? '') : 'DR'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name ?? 'Dr. Mitchell'}</p>
            <p className="text-[11px] text-gray-500 truncate">{user?.office ?? 'Bright Smiles Dental'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
