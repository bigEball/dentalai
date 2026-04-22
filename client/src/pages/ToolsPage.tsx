import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  Shield,
  ShieldCheck,
  DollarSign,
  CreditCard,
  RefreshCw,
  Activity,
  MessageSquare,
  Bell,
  ArrowRightLeft,
  FileCheck,
  Package,
  BarChart3,
  Gauge,
  Settings,
  ArrowRight,
  Search,
  Sunrise,
  ShieldAlert,
  TrendingDown,
  HeartHandshake,
  BadgeDollarSign,
  CalendarClock,
  ShoppingCart,
  Stethoscope,
  ClipboardCheck,
  Sparkles,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { isRouteAllowed, ROLES, resolveRole } from '@/lib/roles';

type Category = 'all' | 'main' | 'ai' | 'office' | 'system';

interface Tool {
  label: string;
  description: string;
  icon: React.ElementType;
  route: string;
  category: Exclude<Category, 'all'>;
  isNew?: boolean;
}

const TOOLS: Tool[] = [
  // ── Main ──
  {
    label: 'Dashboard',
    description: 'Practice overview with daily stats, upcoming appointments, revenue metrics, and recent activity feed.',
    icon: LayoutDashboard,
    route: '/dashboard',
    category: 'main',
  },
  {
    label: 'Morning Huddle',
    description: 'AI-generated daily briefing with schedule preview, high-risk patients, open treatment, and revenue targets.',
    icon: Sunrise,
    route: '/morning-huddle',
    category: 'main',
    isNew: true,
  },
  {
    label: 'Patients',
    description: 'Full patient roster with search, demographics, contact info, balance tracking, and Open Dental integration.',
    icon: Users,
    route: '/patients',
    category: 'main',
  },

  // ── AI Modules ──
  {
    label: 'AI Notes',
    description: 'AI-generated clinical notes from voice or text input. Review, edit, and approve SOAP notes per visit.',
    icon: FileText,
    route: '/notes',
    category: 'ai',
  },
  {
    label: 'Claim Review',
    description: 'Pre-submission claim validation that catches coding errors, missing attachments, and payer-specific rules.',
    icon: ShieldAlert,
    route: '/claim-scrubber',
    category: 'ai',
    isNew: true,
  },
  {
    label: 'Patient Retention',
    description: 'Identifies which patients are likely to stop coming and calculates their lifetime value. Alerts you before they leave so you can reach out.',
    icon: TrendingDown,
    route: '/patient-retention',
    category: 'ai',
    isNew: true,
  },
  {
    label: 'Treatment Follow-Up',
    description: 'Automatically follow up with patients who haven\'t accepted their treatment plans. AI detects why they\'re hesitating and sends personalized messages over 30 days.',
    icon: HeartHandshake,
    route: '/nurture-sequences',
    category: 'ai',
    isNew: true,
  },
  {
    label: 'Clinical Decision Support',
    description: 'Evidence-based treatment suggestions, contraindication alerts, and diagnostic guidance at the chairside.',
    icon: Stethoscope,
    route: '/decision-support',
    category: 'ai',
    isNew: true,
  },
  {
    label: 'Treatment Plans',
    description: 'Create and manage treatment plans with procedure codes, phasing, cost estimates, and patient presentation.',
    icon: ClipboardList,
    route: '/treatment-plans',
    category: 'ai',
  },
  {
    label: 'Insurance',
    description: 'Insurance plan management with eligibility verification, coverage breakdowns, and claim tracking.',
    icon: Shield,
    route: '/insurance',
    category: 'ai',
  },
  {
    label: 'Pre-Auth',
    description: 'Submit and track insurance pre-authorizations. Monitor approval status and attach supporting documentation.',
    icon: ShieldCheck,
    route: '/preauth',
    category: 'ai',
  },
  {
    label: 'Billing',
    description: 'Outstanding balance management with statement generation, payment reminders, and collection status tracking.',
    icon: DollarSign,
    route: '/billing',
    category: 'ai',
  },
  {
    label: 'Payment Plans',
    description: 'Set up and manage installment payment plans. Track payments, due dates, and plan completion status.',
    icon: CreditCard,
    route: '/payment-plans',
    category: 'ai',
  },
  {
    label: 'Fee Optimizer',
    description: 'Analyze and optimize your fee schedule against market rates, UCR data, and payer reimbursement trends.',
    icon: BadgeDollarSign,
    route: '/fee-optimizer',
    category: 'ai',
    isNew: true,
  },
  {
    label: 'Recall',
    description: 'Overdue hygiene recall tracking with AI-suggested outreach messages via text, email, or phone.',
    icon: RefreshCw,
    route: '/recall',
    category: 'ai',
  },
  {
    label: 'Perio Chart',
    description: 'Full-mouth periodontal charting with pocket depths, bleeding points, recession, and historical comparison.',
    icon: Activity,
    route: '/perio',
    category: 'ai',
  },

  // ── Operations ──
  {
    label: 'Smart Scheduling',
    description: 'AI-optimized appointment scheduling that maximizes chair utilization, minimizes gaps, and reduces no-shows.',
    icon: CalendarClock,
    route: '/smart-scheduling',
    category: 'office',
    isNew: true,
  },
  {
    label: 'Patient Interaction',
    description: 'Unified inbox for patient communications across SMS, email, phone, and portal messages.',
    icon: MessageSquare,
    route: '/communications',
    category: 'office',
  },
  {
    label: 'Follow-Ups',
    description: 'Post-appointment follow-up tasks. Send check-in messages, track completion, and schedule reminders.',
    icon: Bell,
    route: '/follow-ups',
    category: 'office',
  },
  {
    label: 'Referrals',
    description: 'Specialist referral management. Create, send, schedule, and track referral status and reports.',
    icon: ArrowRightLeft,
    route: '/referrals',
    category: 'office',
  },
  {
    label: 'Patient Forms',
    description: 'Digital intake and consent forms. Create, send to patients, and review completed submissions.',
    icon: FileCheck,
    route: '/forms',
    category: 'office',
  },
  {
    label: 'Inventory',
    description: 'Supply inventory with stock levels, reorder alerts, import from files, and product search with suggestions.',
    icon: Package,
    route: '/inventory',
    category: 'office',
  },
  {
    label: 'Inventory Management',
    description: 'Supply forecasting, vendor comparison, bulk discount detection, and spend analytics.',
    icon: ShoppingCart,
    route: '/procurement',
    category: 'office',
    isNew: true,
  },
  {
    label: 'Reports',
    description: 'Practice analytics and reporting with production, collections, appointment, and provider metrics.',
    icon: BarChart3,
    route: '/reports',
    category: 'office',
  },
  {
    label: 'Patient Scores',
    description: 'Reliability scoring across attendance, financial, engagement, and treatment commitment dimensions.',
    icon: Gauge,
    route: '/patient-scores',
    category: 'office',
  },

  // ── System ──
  {
    label: 'Compliance Autopilot',
    description: 'Automated HIPAA, OSHA, and state-law compliance monitoring with audit trails and staff training tracking.',
    icon: ClipboardCheck,
    route: '/compliance',
    category: 'system',
    isNew: true,
  },
  {
    label: 'Settings',
    description: 'Practice configuration, Open Dental connection, user management, and system preferences.',
    icon: Settings,
    route: '/settings',
    category: 'system',
  },
];

const ADD_ON_TOOLS: Tool[] = [
  {
    label: 'AI Assistant',
    description: 'Beta employee chatbot preview for Open Dental guidance and Summit AI Services workflow support. Paid add-on, not included in any tier.',
    icon: Bot,
    route: '/ai-assistant',
    category: 'ai',
    isNew: true,
  },
];

const CATEGORIES: { key: Category; label: string; color: string; activeColor: string }[] = [
  { key: 'all', label: 'All', color: 'text-gray-600 bg-white border-gray-200 hover:border-gray-300', activeColor: 'text-white bg-gray-900 border-gray-900' },
  { key: 'main', label: 'Main', color: 'text-slate-600 bg-white border-gray-200 hover:border-slate-400', activeColor: 'text-white bg-slate-700 border-slate-700' },
  { key: 'ai', label: 'AI Modules', color: 'text-indigo-600 bg-white border-gray-200 hover:border-indigo-400', activeColor: 'text-white bg-indigo-600 border-indigo-600' },
  { key: 'office', label: 'Operations', color: 'text-emerald-600 bg-white border-gray-200 hover:border-emerald-400', activeColor: 'text-white bg-emerald-600 border-emerald-600' },
  { key: 'system', label: 'System', color: 'text-amber-600 bg-white border-gray-200 hover:border-amber-400', activeColor: 'text-white bg-amber-600 border-amber-600' },
];

const CATEGORY_ICON_BG: Record<string, string> = {
  main: 'bg-slate-100 text-slate-600 group-hover:bg-slate-200',
  ai: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100',
  office: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
  system: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
};

const CATEGORY_HOVER_BORDER: Record<string, string> = {
  main: 'hover:border-slate-300',
  ai: 'hover:border-indigo-300',
  office: 'hover:border-emerald-300',
  system: 'hover:border-amber-300',
};

export default function ToolsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const currentRole = resolveRole(user?.role);
  const tierTools = useMemo(
    () => TOOLS.filter((tool) => isRouteAllowed(currentRole, tool.route)),
    [currentRole],
  );

  const filtered = useMemo(() => {
    let list = tierTools;
    if (activeCategory !== 'all') {
      list = list.filter((t) => t.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [query, activeCategory, tierTools]);

  const filteredAddOns = useMemo(() => {
    if (activeCategory !== 'all' && activeCategory !== 'ai') return [];
    if (!query.trim()) return ADD_ON_TOOLS;
    const q = query.toLowerCase();
    return ADD_ON_TOOLS.filter(
      (t) => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }, [activeCategory, query]);

  const newCount = tierTools.filter((t) => t.isNew).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900">All Tools</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
              {tierTools.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Included in {ROLES[currentRole].label}: {ROLES[currentRole].summary}
          </p>
        </div>
        {newCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
            <Sparkles size={14} />
            {newCount} new tools recently added
          </div>
        )}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            const count = cat.key === 'all' ? tierTools.length : tierTools.filter((t) => t.category === cat.key).length;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                  isActive ? cat.activeColor : cat.color,
                )}
              >
                {cat.label}
                <span className={cn(
                  'rounded-full px-1.5 py-px text-[10px] font-semibold',
                  isActive ? 'bg-white/20 text-white/90' : 'bg-gray-100 text-gray-500',
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 && filteredAddOns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search size={40} className="text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">No tools match your search</p>
          <p className="text-xs text-gray-400 mt-1">Try a different keyword or clear your filters.</p>
          <button
            onClick={() => { setQuery(''); setActiveCategory('all'); }}
            className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.route}
                onClick={() => navigate(tool.route)}
                className={cn(
                  'group relative flex items-start gap-3.5 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md',
                  CATEGORY_HOVER_BORDER[tool.category],
                )}
              >
                {tool.isNew && (
                  <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                    <Sparkles size={10} />
                    New
                  </span>
                )}
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                  CATEGORY_ICON_BG[tool.category],
                )}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1 pr-6">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-900">{tool.label}</span>
                    <ArrowRight size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{tool.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {filteredAddOns.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Paid add-ons</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Optional tools that are separate from Bronze, Silver, and Gold.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAddOns.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.route}
                  onClick={() => navigate(tool.route)}
                  className="group relative flex items-start gap-3.5 rounded-xl border border-amber-200 bg-white p-4 text-left shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
                >
                  <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Add-on
                  </span>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1 pr-6">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-900">{tool.label}</span>
                      <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                        Beta
                      </span>
                      <ArrowRight size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{tool.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
