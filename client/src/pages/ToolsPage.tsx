import React from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tool {
  label: string;
  description: string;
  icon: React.ElementType;
  route: string;
  category: 'main' | 'ai' | 'office' | 'system';
}

const TOOLS: Tool[] = [
  {
    label: 'Dashboard',
    description: 'Practice overview with daily stats, upcoming appointments, revenue metrics, and recent activity feed.',
    icon: LayoutDashboard,
    route: '/dashboard',
    category: 'main',
  },
  {
    label: 'Patients',
    description: 'Full patient roster with search, demographics, contact info, balance tracking, and Open Dental integration.',
    icon: Users,
    route: '/patients',
    category: 'main',
  },
  {
    label: 'AI Notes',
    description: 'AI-generated clinical notes from voice or text input. Review, edit, and approve SOAP notes per visit.',
    icon: FileText,
    route: '/notes',
    category: 'ai',
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
  {
    label: 'Communications',
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
  {
    label: 'Compliance',
    description: 'HIPAA, OSHA, state law, and billing compliance checklists with status tracking and guidance.',
    icon: Shield,
    route: '/compliance',
    category: 'system',
  },
  {
    label: 'Settings',
    description: 'Practice configuration, Open Dental connection, user management, and system preferences.',
    icon: Settings,
    route: '/settings',
    category: 'system',
  },
];

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  main: { label: 'Main', color: 'bg-slate-100 text-slate-700' },
  ai: { label: 'AI Modules', color: 'bg-indigo-50 text-indigo-700' },
  office: { label: 'Office', color: 'bg-emerald-50 text-emerald-700' },
  system: { label: 'System', color: 'bg-amber-50 text-amber-700' },
};

const CATEGORY_ORDER = ['main', 'ai', 'office', 'system'] as const;

export default function ToolsPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Tools</h1>
        <p className="mt-1 text-sm text-gray-500">
          Every module available in Smart Dental AI at a glance.
        </p>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const meta = CATEGORY_META[cat];
        const items = TOOLS.filter((t) => t.category === cat);
        return (
          <section key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', meta.color)}>
                {meta.label}
              </span>
              <span className="text-xs text-gray-400">{items.length} tools</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.route}
                    onClick={() => navigate(tool.route)}
                    className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
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
          </section>
        );
      })}
    </div>
  );
}
