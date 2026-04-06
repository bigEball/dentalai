import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  DollarSign,
  RefreshCw,
  Settings,
  LogOut,
  ClipboardList,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  FileCheck,
  Bell,
  ArrowRightLeft,
  Package,
  Activity,
  Gauge,
  Layers,
  Sunrise,
  ShieldAlert,
  TrendingDown,
  HeartHandshake,
  BadgeDollarSign,
  CalendarClock,
  ShoppingCart,
  Stethoscope,
  ClipboardCheck,
  Building2,
  ChevronUp,
  UserCog,
  Briefcase,
  Wrench,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';
import { getSystemStatus } from '@/lib/api';
import type { SystemStatus } from '@/lib/api';
import { ROLES, filterNavItems, resolveRole, type DemoRole } from '@/lib/roles';

const MAIN_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/morning-huddle', label: 'Morning Huddle', icon: Sunrise },
  { to: '/patients', label: 'Patients', icon: Users },
];

const AI_NAV = [
  { to: '/notes', label: 'AI Notes', icon: FileText },
  { to: '/claim-scrubber', label: 'Claim Scrubber', icon: ShieldAlert },
  { to: '/patient-retention', label: 'Patient Retention', icon: TrendingDown },
  { to: '/nurture-sequences', label: 'Treatment Follow-Up', icon: HeartHandshake },
  { to: '/decision-support', label: 'Clinical AI', icon: Stethoscope },
  { to: '/treatment-plans', label: 'Treatment Plans', icon: ClipboardList },
  { to: '/insurance', label: 'Insurance', icon: Shield },
  { to: '/preauth', label: 'Pre-Auth', icon: ShieldCheck },
  { to: '/billing', label: 'Billing', icon: DollarSign },
  { to: '/payment-plans', label: 'Payment Plans', icon: CreditCard },
  { to: '/fee-optimizer', label: 'Fee Optimizer', icon: BadgeDollarSign },
  { to: '/recall', label: 'Recall', icon: RefreshCw },
  { to: '/perio', label: 'Perio Chart', icon: Activity },
];

const OFFICE_NAV = [
  { to: '/smart-scheduling', label: 'Smart Scheduling', icon: CalendarClock },
  { to: '/communications', label: 'Communications', icon: MessageSquare },
  { to: '/follow-ups', label: 'Follow-Ups', icon: Bell },
  { to: '/referrals', label: 'Referrals', icon: ArrowRightLeft },
  { to: '/forms', label: 'Patient Forms', icon: FileCheck },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/procurement', label: 'Procurement AI', icon: ShoppingCart },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/patient-scores', label: 'Patient Scores', icon: Gauge },
];

const SYSTEM_NAV = [
  { to: '/compliance', label: 'Compliance', icon: ClipboardCheck },
  { to: '/multi-location', label: 'Multi-Location', icon: Building2 },
  { to: '/tools', label: 'All Tools', icon: Layers },
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

const ROLE_ICONS: Record<DemoRole, React.ElementType> = {
  doctor: UserCog,
  office: Briefcase,
  assistant: Wrench,
};

const ROLE_COLORS: Record<DemoRole, string> = {
  doctor: 'text-indigo-400',
  office: 'text-emerald-400',
  assistant: 'text-amber-400',
};

export default function Sidebar() {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentRole = resolveRole(user?.role);

  useEffect(() => {
    getSystemStatus()
      .then(setStatus)
      .catch(() => setStatus({ mode: 'demo', openDentalConnected: false, ollamaAvailable: false }));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
    }
    if (roleDropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [roleDropdownOpen]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleSwitchRole(role: DemoRole) {
    switchRole(role);
    setRoleDropdownOpen(false);
    navigate('/dashboard');
  }

  // Filter nav items by role
  const mainNav = filterNavItems(currentRole, MAIN_NAV);
  const aiNav = filterNavItems(currentRole, AI_NAV);
  const officeNav = filterNavItems(currentRole, OFFICE_NAV);
  const systemNav = filterNavItems(currentRole, SYSTEM_NAV);

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
        {mainNav.length > 0 && <NavSection label="Main" items={mainNav} />}
        {aiNav.length > 0 && <NavSection label="AI Modules" items={aiNav} />}
        {officeNav.length > 0 && <NavSection label="Office" items={officeNav} />}
        {systemNav.length > 0 && <NavSection label="System" items={systemNav} />}
      </div>

      {/* Demo mode role switcher */}
      {status?.mode === 'demo' && (
        <div className="px-4 pb-2 relative" ref={dropdownRef}>
          {/* Dropdown menu (opens upward) */}
          {roleDropdownOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-1 rounded-lg border border-white/10 overflow-hidden"
              style={{ backgroundColor: '#1a1b23' }}
            >
              <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 border-b border-white/5">
                Switch Demo View
              </p>
              {(Object.keys(ROLES) as DemoRole[]).map((role) => {
                const config = ROLES[role];
                const Icon = ROLE_ICONS[role];
                const isActive = role === currentRole;
                return (
                  <button
                    key={role}
                    onClick={() => handleSwitchRole(role)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      isActive ? 'bg-white/5' : 'hover:bg-white/5'
                    }`}
                  >
                    <Icon size={14} className={ROLE_COLORS[role]} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {config.label}
                      </p>
                      <p className="text-[10px] text-gray-500">{config.userName}</p>
                    </div>
                    {isActive && <Check size={12} className="text-green-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Trigger button */}
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              Demo — {ROLES[currentRole].label}
            </span>
            <ChevronUp size={10} className={`text-amber-400 transition-transform ${roleDropdownOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
      )}

      {/* Live mode indicator */}
      {status && status.mode !== 'demo' && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">
              Live
            </span>
          </div>
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
