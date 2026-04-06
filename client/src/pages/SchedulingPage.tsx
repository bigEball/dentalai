import React, { useEffect, useState, useCallback } from 'react';
import {
  CalendarClock,
  Clock,
  Users,
  AlertTriangle,
  Plus,
  UserPlus,
  BarChart3,
  Armchair,
  Loader2,
  Check,
  Phone,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NoShowPrediction {
  appointmentId: string;
  patientId: string;
  patientName: string;
  procedureType: string;
  date: string;
  time: string;
  duration: number;
  probability: number;
  suggestedAction: 'double_book' | 'confirm' | null;
  riskFactors: string[];
}

interface ChairSlot {
  chair: number;
  startTime: string;
  endTime: string;
  appointmentId: string | null;
  patientName: string | null;
  procedureType: string | null;
  duration: number;
  noShowRisk: number;
  isGap: boolean;
}

interface ChairData {
  chair: number;
  bookedMinutes: number;
  availableMinutes: number;
  utilization: number;
  revenueEstimate: number;
  slots: ChairSlot[];
  gaps: { start: string; end: string; duration: number }[];
}

interface Utilization {
  date: string;
  totalChairs: number;
  operatingHours: { start: string; end: string };
  totalAvailableMinutes: number;
  totalBookedMinutes: number;
  utilization: number;
  chairs: ChairData[];
  revenuePerChairHour: number;
  totalRevenueEstimate: number;
}

interface WaitlistEntry {
  id: string;
  patientId: string;
  patientName: string;
  procedureType: string;
  estimatedDuration: number;
  preferredDays: string[];
  preferredTimes: string;
  urgency: 'routine' | 'soon' | 'urgent';
  treatmentPlanId?: string;
  status: 'waiting' | 'offered' | 'scheduled' | 'expired';
  createdAt: string;
}

interface DashboardStats {
  date: string;
  chairUtilization: number;
  avgNoShowRisk: number;
  revenuePerChairHour: number;
  waitlistSize: number;
  highRiskCount: number;
  totalAppointments: number;
  totalRevenueEstimate: number;
  topRiskAppointments: NoShowPrediction[];
}

interface WeeklyDay {
  date: string;
  dayOfWeek: string;
  utilization: number;
  bookedMinutes: number;
  appointmentCount: number;
  revenueEstimate: number;
}

interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  procedures: { type: string; count: number; avgDuration: number; avgRevenue: number }[];
  estimatedRevenue: number;
  estimatedUtilization: number;
  recommendedProviders: string[];
}

// ---------------------------------------------------------------------------
// Mock data fallbacks
// ---------------------------------------------------------------------------

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function weekAgoStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().split('T')[0];
}

const MOCK_DASHBOARD: DashboardStats = {
  date: todayStr(),
  chairUtilization: 72.4,
  avgNoShowRisk: 0.18,
  revenuePerChairHour: 285,
  waitlistSize: 6,
  highRiskCount: 3,
  totalAppointments: 18,
  totalRevenueEstimate: 6840,
  topRiskAppointments: [
    { appointmentId: 'a1', patientId: 'p1', patientName: 'Maria Garcia', procedureType: 'consultation', date: todayStr(), time: '09:00', duration: 30, probability: 0.52, suggestedAction: 'double_book', riskFactors: ['Consultation procedures have higher no-show rates', 'Patient has 40% historical no-show rate'] },
    { appointmentId: 'a2', patientId: 'p2', patientName: 'James Wilson', procedureType: 'hygiene', date: todayStr(), time: '14:00', duration: 60, probability: 0.38, suggestedAction: 'confirm', riskFactors: ['Monday/Friday appointments see more no-shows', 'No prior appointment history (using default rate)'] },
    { appointmentId: 'a3', patientId: 'p3', patientName: 'Sarah Chen', procedureType: 'restorative', date: todayStr(), time: '16:30', duration: 45, probability: 0.34, suggestedAction: 'confirm', riskFactors: ['Early morning or late afternoon slots have higher risk'] },
  ],
};

const MOCK_UTILIZATION: Utilization = {
  date: todayStr(),
  totalChairs: 4,
  operatingHours: { start: '08:00', end: '17:00' },
  totalAvailableMinutes: 2160,
  totalBookedMinutes: 1560,
  utilization: 72.2,
  chairs: [
    { chair: 1, bookedMinutes: 420, availableMinutes: 540, utilization: 77.8, revenueEstimate: 2150, slots: [
      { chair: 1, startTime: '08:00', endTime: '09:30', appointmentId: 'a10', patientName: 'John Smith', procedureType: 'crown', duration: 90, noShowRisk: 0.08, isGap: false },
      { chair: 1, startTime: '09:30', endTime: '10:00', appointmentId: null, patientName: null, procedureType: null, duration: 30, noShowRisk: 0, isGap: true },
      { chair: 1, startTime: '10:00', endTime: '10:30', appointmentId: 'a11', patientName: 'Maria Garcia', procedureType: 'consultation', duration: 30, noShowRisk: 0.52, isGap: false },
      { chair: 1, startTime: '10:30', endTime: '11:30', appointmentId: 'a12', patientName: 'Robert Lee', procedureType: 'restorative', duration: 60, noShowRisk: 0.12, isGap: false },
      { chair: 1, startTime: '11:30', endTime: '13:00', appointmentId: null, patientName: null, procedureType: null, duration: 90, noShowRisk: 0, isGap: true },
      { chair: 1, startTime: '13:00', endTime: '14:30', appointmentId: 'a13', patientName: 'Emily Davis', procedureType: 'root_canal', duration: 90, noShowRisk: 0.06, isGap: false },
      { chair: 1, startTime: '14:30', endTime: '15:30', appointmentId: 'a14', patientName: 'Tom Brown', procedureType: 'restorative', duration: 60, noShowRisk: 0.15, isGap: false },
      { chair: 1, startTime: '15:30', endTime: '16:00', appointmentId: 'a15', patientName: 'Lisa Wang', procedureType: 'consultation', duration: 30, noShowRisk: 0.35, isGap: false },
      { chair: 1, startTime: '16:00', endTime: '17:00', appointmentId: null, patientName: null, procedureType: null, duration: 60, noShowRisk: 0, isGap: true },
    ], gaps: [{ start: '09:30', end: '10:00', duration: 30 }, { start: '11:30', end: '13:00', duration: 90 }, { start: '16:00', end: '17:00', duration: 60 }] },
    { chair: 2, bookedMinutes: 390, availableMinutes: 540, utilization: 72.2, revenueEstimate: 1640, slots: [
      { chair: 2, startTime: '08:00', endTime: '09:00', appointmentId: 'a20', patientName: 'Ana Martinez', procedureType: 'hygiene', duration: 60, noShowRisk: 0.14, isGap: false },
      { chair: 2, startTime: '09:00', endTime: '10:00', appointmentId: 'a21', patientName: 'David Kim', procedureType: 'hygiene', duration: 60, noShowRisk: 0.10, isGap: false },
      { chair: 2, startTime: '10:00', endTime: '11:00', appointmentId: 'a22', patientName: 'Rachel Green', procedureType: 'hygiene', duration: 60, noShowRisk: 0.18, isGap: false },
      { chair: 2, startTime: '11:00', endTime: '12:00', appointmentId: 'a23', patientName: 'Kevin Park', procedureType: 'hygiene', duration: 60, noShowRisk: 0.09, isGap: false },
      { chair: 2, startTime: '12:00', endTime: '13:00', appointmentId: null, patientName: null, procedureType: null, duration: 60, noShowRisk: 0, isGap: true },
      { chair: 2, startTime: '13:00', endTime: '14:00', appointmentId: 'a24', patientName: 'Sophie Turner', procedureType: 'hygiene', duration: 60, noShowRisk: 0.11, isGap: false },
      { chair: 2, startTime: '14:00', endTime: '15:00', appointmentId: 'a25', patientName: 'James Wilson', procedureType: 'hygiene', duration: 60, noShowRisk: 0.38, isGap: false },
      { chair: 2, startTime: '15:00', endTime: '15:30', appointmentId: 'a26', patientName: 'Amy Collins', procedureType: 'exam', duration: 30, noShowRisk: 0.22, isGap: false },
      { chair: 2, startTime: '15:30', endTime: '17:00', appointmentId: null, patientName: null, procedureType: null, duration: 90, noShowRisk: 0, isGap: true },
    ], gaps: [{ start: '12:00', end: '13:00', duration: 60 }, { start: '15:30', end: '17:00', duration: 90 }] },
    { chair: 3, bookedMinutes: 420, availableMinutes: 540, utilization: 77.8, revenueEstimate: 1950, slots: [
      { chair: 3, startTime: '08:00', endTime: '08:45', appointmentId: 'a30', patientName: 'Chris Patel', procedureType: 'restorative', duration: 45, noShowRisk: 0.07, isGap: false },
      { chair: 3, startTime: '08:45', endTime: '09:30', appointmentId: 'a31', patientName: 'Diana Ross', procedureType: 'restorative', duration: 45, noShowRisk: 0.11, isGap: false },
      { chair: 3, startTime: '09:30', endTime: '10:00', appointmentId: 'a32', patientName: 'Frank Miller', procedureType: 'exam', duration: 30, noShowRisk: 0.20, isGap: false },
      { chair: 3, startTime: '10:00', endTime: '11:30', appointmentId: 'a33', patientName: 'Nancy Drew', procedureType: 'crown', duration: 90, noShowRisk: 0.05, isGap: false },
      { chair: 3, startTime: '11:30', endTime: '13:00', appointmentId: null, patientName: null, procedureType: null, duration: 90, noShowRisk: 0, isGap: true },
      { chair: 3, startTime: '13:00', endTime: '13:45', appointmentId: 'a34', patientName: 'Oscar Wilde', procedureType: 'restorative', duration: 45, noShowRisk: 0.13, isGap: false },
      { chair: 3, startTime: '13:45', endTime: '14:45', appointmentId: 'a35', patientName: 'Grace Kelly', procedureType: 'hygiene', duration: 60, noShowRisk: 0.16, isGap: false },
      { chair: 3, startTime: '14:45', endTime: '15:30', appointmentId: 'a36', patientName: 'Sarah Chen', procedureType: 'restorative', duration: 45, noShowRisk: 0.34, isGap: false },
      { chair: 3, startTime: '15:30', endTime: '17:00', appointmentId: null, patientName: null, procedureType: null, duration: 90, noShowRisk: 0, isGap: true },
    ], gaps: [{ start: '11:30', end: '13:00', duration: 90 }, { start: '15:30', end: '17:00', duration: 90 }] },
    { chair: 4, bookedMinutes: 330, availableMinutes: 540, utilization: 61.1, revenueEstimate: 1100, slots: [
      { chair: 4, startTime: '08:00', endTime: '09:00', appointmentId: 'a40', patientName: 'Wendy Clark', procedureType: 'hygiene', duration: 60, noShowRisk: 0.10, isGap: false },
      { chair: 4, startTime: '09:00', endTime: '09:45', appointmentId: 'a41', patientName: 'Brian Adams', procedureType: 'restorative', duration: 45, noShowRisk: 0.09, isGap: false },
      { chair: 4, startTime: '09:45', endTime: '10:15', appointmentId: 'a42', patientName: 'Kelly Jones', procedureType: 'exam', duration: 30, noShowRisk: 0.19, isGap: false },
      { chair: 4, startTime: '10:15', endTime: '11:15', appointmentId: 'a43', patientName: 'Mike Thompson', procedureType: 'restorative', duration: 60, noShowRisk: 0.14, isGap: false },
      { chair: 4, startTime: '11:15', endTime: '13:30', appointmentId: null, patientName: null, procedureType: null, duration: 135, noShowRisk: 0, isGap: true },
      { chair: 4, startTime: '13:30', endTime: '14:30', appointmentId: 'a44', patientName: 'Nina Williams', procedureType: 'hygiene', duration: 60, noShowRisk: 0.21, isGap: false },
      { chair: 4, startTime: '14:30', endTime: '15:05', appointmentId: 'a45', patientName: 'Paul Richards', procedureType: 'consultation', duration: 35, noShowRisk: 0.28, isGap: false },
      { chair: 4, startTime: '15:05', endTime: '17:00', appointmentId: null, patientName: null, procedureType: null, duration: 115, noShowRisk: 0, isGap: true },
    ], gaps: [{ start: '11:15', end: '13:30', duration: 135 }, { start: '15:05', end: '17:00', duration: 115 }] },
  ],
  revenuePerChairHour: 264,
  totalRevenueEstimate: 6840,
};

const MOCK_WAITLIST: WaitlistEntry[] = [
  { id: 'wl-1', patientId: 'p10', patientName: 'Carlos Rivera', procedureType: 'crown', estimatedDuration: 90, preferredDays: ['monday', 'wednesday'], preferredTimes: 'morning', urgency: 'urgent', status: 'waiting', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'wl-2', patientId: 'p11', patientName: 'Janet Lee', procedureType: 'root_canal', estimatedDuration: 90, preferredDays: ['tuesday', 'thursday'], preferredTimes: 'afternoon', urgency: 'soon', status: 'waiting', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'wl-3', patientId: 'p12', patientName: 'Derek Morgan', procedureType: 'hygiene', estimatedDuration: 60, preferredDays: [], preferredTimes: 'any', urgency: 'routine', status: 'waiting', createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 'wl-4', patientId: 'p13', patientName: 'Priya Sharma', procedureType: 'restorative', estimatedDuration: 45, preferredDays: ['monday', 'friday'], preferredTimes: 'morning', urgency: 'soon', status: 'waiting', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'wl-5', patientId: 'p14', patientName: 'Tyler Brooks', procedureType: 'consultation', estimatedDuration: 30, preferredDays: [], preferredTimes: 'any', urgency: 'routine', status: 'waiting', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'wl-6', patientId: 'p15', patientName: 'Angela Torres', procedureType: 'extraction', estimatedDuration: 60, preferredDays: ['wednesday'], preferredTimes: 'morning', urgency: 'urgent', status: 'offered', createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
];

const MOCK_WEEKLY: WeeklyDay[] = (() => {
  const days: WeeklyDay[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const utils = [0, 68.5, 74.2, 81.3, 72.8, 65.1, 42.0];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    days.push({
      date: d.toISOString().split('T')[0],
      dayOfWeek: dayNames[d.getDay()],
      utilization: utils[i],
      bookedMinutes: Math.round(utils[i] * 21.6),
      appointmentCount: Math.round(utils[i] / 4.5),
      revenueEstimate: Math.round(utils[i] * 85),
    });
  }
  return days;
})();

const MOCK_TEMPLATES: ScheduleTemplate[] = [
  {
    id: 'production-day', name: 'Production Day',
    description: 'Maximize revenue with high-value procedures. Ideal for days with the strongest clinical team.',
    procedures: [
      { type: 'Crown Prep', count: 2, avgDuration: 90, avgRevenue: 1200 },
      { type: 'Root Canal', count: 1, avgDuration: 90, avgRevenue: 950 },
      { type: 'Large Restoration', count: 2, avgDuration: 60, avgRevenue: 450 },
      { type: 'Consultation', count: 3, avgDuration: 30, avgRevenue: 100 },
    ],
    estimatedRevenue: 4050, estimatedUtilization: 87,
    recommendedProviders: ['Dentist + Assistant', 'Hygienist for overflow exams'],
  },
  {
    id: 'hygiene-heavy', name: 'Hygiene Heavy',
    description: 'Recall and preventive focus. Great for maintaining patient relationships and steady cash flow.',
    procedures: [
      { type: 'Hygiene / Cleaning', count: 8, avgDuration: 60, avgRevenue: 180 },
      { type: 'Perio Maintenance', count: 2, avgDuration: 60, avgRevenue: 220 },
      { type: 'Exam / New Patient', count: 2, avgDuration: 45, avgRevenue: 120 },
    ],
    estimatedRevenue: 2120, estimatedUtilization: 72,
    recommendedProviders: ['2 Hygienists', 'Dentist for exams'],
  },
  {
    id: 'balanced-mix', name: 'Balanced Mix',
    description: 'A well-rounded day balancing production, hygiene, and new patient flow.',
    procedures: [
      { type: 'Crown Prep', count: 1, avgDuration: 90, avgRevenue: 1200 },
      { type: 'Restoration', count: 4, avgDuration: 45, avgRevenue: 350 },
      { type: 'Hygiene / Cleaning', count: 4, avgDuration: 60, avgRevenue: 180 },
      { type: 'Exam', count: 2, avgDuration: 30, avgRevenue: 120 },
      { type: 'Consultation', count: 1, avgDuration: 30, avgRevenue: 100 },
    ],
    estimatedRevenue: 3460, estimatedUtilization: 81,
    recommendedProviders: ['Dentist + Assistant', '1 Hygienist'],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m || 0).padStart(2, '0')} ${ampm}`;
}

function riskColor(p: number): string {
  if (p >= 0.6) return 'bg-red-500';
  if (p >= 0.4) return 'bg-orange-400';
  if (p >= 0.2) return 'bg-yellow-400';
  return 'bg-green-500';
}

function riskBorderColor(p: number): string {
  if (p >= 0.6) return 'border-red-400';
  if (p >= 0.4) return 'border-orange-300';
  if (p >= 0.2) return 'border-yellow-300';
  return 'border-green-400';
}

function riskBgColor(p: number): string {
  if (p >= 0.6) return 'bg-red-50';
  if (p >= 0.4) return 'bg-orange-50';
  if (p >= 0.2) return 'bg-yellow-50';
  return 'bg-green-50';
}

function riskTextColor(p: number): string {
  if (p >= 0.6) return 'text-red-700';
  if (p >= 0.4) return 'text-orange-700';
  if (p >= 0.2) return 'text-yellow-700';
  return 'text-green-700';
}

function urgencyBadge(urgency: string): string {
  switch (urgency) {
    case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
    case 'soon': return 'bg-amber-50 text-amber-700 border-amber-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function statusBadge(status: string): string {
  switch (status) {
    case 'waiting': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'offered': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'scheduled': return 'bg-green-50 text-green-700 border-green-200';
    case 'expired': return 'bg-gray-100 text-gray-500 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function daysSince(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day';
  return `${diff} days`;
}

// ---------------------------------------------------------------------------
// TIME SLOTS for the grid
// ---------------------------------------------------------------------------

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h < 17; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SchedulingPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [activeTab, setActiveTab] = useState<'schedule' | 'waitlist' | 'templates' | 'trends'>('schedule');
  const [loading, setLoading] = useState(true);

  // Data
  const [dashboard, setDashboard] = useState<DashboardStats>(MOCK_DASHBOARD);
  const [utilization, setUtilization] = useState<Utilization>(MOCK_UTILIZATION);
  const [waitlistData, setWaitlistData] = useState<WaitlistEntry[]>(MOCK_WAITLIST);
  const [weeklyData, setWeeklyData] = useState<WeeklyDay[]>(MOCK_WEEKLY);
  const [templates, setTemplates] = useState<ScheduleTemplate[]>(MOCK_TEMPLATES);
  const [predictions, setPredictions] = useState<NoShowPrediction[]>(MOCK_DASHBOARD.topRiskAppointments);

  // Modals
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<ChairSlot | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Waitlist form
  const [wlForm, setWlForm] = useState({
    patientId: '',
    patientName: '',
    procedureType: 'hygiene',
    estimatedDuration: 60,
    preferredDays: [] as string[],
    preferredTimes: 'any',
    urgency: 'routine' as 'routine' | 'soon' | 'urgent',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, utilRes, wlRes, weeklyRes, tplRes] = await Promise.allSettled([
        api.get(`/scheduling/dashboard/${selectedDate}`),
        api.get(`/scheduling/utilization/${selectedDate}`),
        api.get('/scheduling/waitlist'),
        api.get('/scheduling/utilization/weekly', { params: { startDate: weekAgoStr() } }),
        api.get('/scheduling/templates'),
      ]);

      if (dashRes.status === 'fulfilled') {
        setDashboard(dashRes.value.data);
        setPredictions(dashRes.value.data.topRiskAppointments ?? []);
      }
      if (utilRes.status === 'fulfilled') setUtilization(utilRes.value.data);
      if (wlRes.status === 'fulfilled') {
        const wl = wlRes.value.data;
        if (Array.isArray(wl) && wl.length > 0) setWaitlistData(wl);
      }
      if (weeklyRes.status === 'fulfilled' && weeklyRes.value.data.days) {
        setWeeklyData(weeklyRes.value.data.days);
      }
      if (tplRes.status === 'fulfilled' && Array.isArray(tplRes.value.data)) {
        setTemplates(tplRes.value.data);
      }
    } catch {
      // Fallback to mock data already set
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // ---- Waitlist actions ----
  const handleAddToWaitlist = async () => {
    if (!wlForm.patientName || !wlForm.procedureType) {
      toast.error('Patient name and procedure are required');
      return;
    }
    try {
      const { data } = await api.post('/scheduling/waitlist', {
        ...wlForm,
        patientId: wlForm.patientId || `p-${Date.now()}`,
      });
      setWaitlistData((prev) => [...prev, data]);
      setShowWaitlistModal(false);
      setWlForm({ patientId: '', patientName: '', procedureType: 'hygiene', estimatedDuration: 60, preferredDays: [], preferredTimes: 'any', urgency: 'routine' });
      toast.success('Added to waitlist');
    } catch {
      // Still add to local state as mock
      const entry: WaitlistEntry = {
        id: `wl-${Date.now()}`,
        ...wlForm,
        patientId: wlForm.patientId || `p-${Date.now()}`,
        status: 'waiting',
        createdAt: new Date().toISOString(),
      };
      setWaitlistData((prev) => [...prev, entry]);
      setShowWaitlistModal(false);
      toast.success('Added to waitlist (demo mode)');
    }
  };

  const handleConfirmAppointment = async (pred: NoShowPrediction) => {
    toast.success(`Confirmation sent to ${pred.patientName}`);
  };

  const handleOverbook = async (pred: NoShowPrediction) => {
    toast.success(`Overbook slot noted for ${pred.time} on ${pred.date}`);
  };

  // ---- Render helpers ----

  const renderStatCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Chair Utilization"
        value={`${dashboard.chairUtilization}%`}
        icon={<Armchair size={20} />}
        iconColor="text-indigo-600 bg-indigo-50"
        subtitle={`${dashboard.totalAppointments} appointments today`}
        change={dashboard.chairUtilization >= 75 ? 'On target' : 'Below target'}
        changeType={dashboard.chairUtilization >= 75 ? 'positive' : 'negative'}
      />
      <StatCard
        title="Avg No-Show Risk"
        value={`${Math.round(dashboard.avgNoShowRisk * 100)}%`}
        icon={<AlertTriangle size={20} />}
        iconColor={dashboard.avgNoShowRisk > 0.25 ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'}
        subtitle={`${dashboard.highRiskCount} high-risk appointments`}
        change={dashboard.highRiskCount > 0 ? `${dashboard.highRiskCount} need attention` : 'All clear'}
        changeType={dashboard.highRiskCount > 3 ? 'negative' : dashboard.highRiskCount > 0 ? 'neutral' : 'positive'}
      />
      <StatCard
        title="Revenue / Chair-Hour"
        value={formatCurrency(dashboard.revenuePerChairHour)}
        icon={<BarChart3 size={20} />}
        iconColor="text-emerald-600 bg-emerald-50"
        subtitle={`${formatCurrency(dashboard.totalRevenueEstimate)} total est.`}
      />
      <StatCard
        title="Waitlist Size"
        value={dashboard.waitlistSize || waitlistData.filter((w) => w.status === 'waiting').length}
        icon={<Users size={20} />}
        iconColor="text-purple-600 bg-purple-50"
        subtitle="Patients waiting for openings"
      />
    </div>
  );

  // ---- Schedule Grid ----
  const renderScheduleGrid = () => {
    const chairs = utilization.chairs;

    return (
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Chair Schedule</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Low risk</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Medium</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400 inline-block" /> High</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Very high</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(156,163,175,0.4) 2px, rgba(156,163,175,0.4) 4px)' }} /> Gap</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header */}
            <div className="grid grid-cols-[70px_repeat(4,1fr)] border-b border-gray-100 bg-gray-50">
              <div className="px-3 py-2 text-xs font-medium text-gray-500">Time</div>
              {[1, 2, 3, 4].map((c) => (
                <div key={c} className="px-3 py-2 text-xs font-medium text-gray-500 text-center border-l border-gray-100">
                  Chair {c}
                  <span className="block text-[10px] text-gray-400 font-normal">
                    {chairs[c - 1]?.utilization ?? 0}% util
                  </span>
                </div>
              ))}
            </div>
            {/* Time rows */}
            <div className="relative">
              {TIME_SLOTS.map((slotTime) => {
                const slotMin = timeToMinutes(slotTime);
                return (
                  <div key={slotTime} className="grid grid-cols-[70px_repeat(4,1fr)] border-b border-gray-50 min-h-[36px]">
                    <div className="px-3 py-1 text-[11px] text-gray-400 tabular-nums border-r border-gray-100 flex items-start pt-1.5">
                      {formatTime(slotTime)}
                    </div>
                    {chairs.map((chair) => {
                      const slot = chair.slots.find((s) => {
                        const sMin = timeToMinutes(s.startTime);
                        const eMin = timeToMinutes(s.endTime);
                        return slotMin >= sMin && slotMin < eMin;
                      });

                      if (!slot) {
                        return <div key={chair.chair} className="border-l border-gray-100" />;
                      }

                      const sMin = timeToMinutes(slot.startTime);
                      const isStart = slotMin === sMin;

                      if (!isStart) {
                        return <div key={chair.chair} className="border-l border-gray-100" />;
                      }

                      const spanRows = Math.ceil(slot.duration / 30);

                      if (slot.isGap) {
                        return (
                          <div
                            key={chair.chair}
                            className="border-l border-gray-100 relative"
                            style={{ gridRow: `span ${spanRows}` }}
                          >
                            <div
                              className="absolute inset-0.5 rounded bg-gray-100 flex items-center justify-center"
                              style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(156,163,175,0.2) 3px, rgba(156,163,175,0.2) 5px)',
                                height: `${spanRows * 36 - 4}px`,
                              }}
                            >
                              <span className="text-[10px] text-gray-400">{slot.duration}m gap</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={chair.chair}
                          className="border-l border-gray-100 relative"
                          style={{ gridRow: `span ${spanRows}` }}
                        >
                          <div
                            className={cn(
                              'absolute inset-0.5 rounded border-l-[3px] px-2 py-1 cursor-pointer transition-shadow hover:shadow-md',
                              riskBgColor(slot.noShowRisk),
                              riskBorderColor(slot.noShowRisk),
                            )}
                            style={{ height: `${spanRows * 36 - 4}px` }}
                            onMouseEnter={(e) => {
                              setHoveredSlot(slot);
                              setTooltipPos({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseLeave={() => setHoveredSlot(null)}
                          >
                            <p className="text-[11px] font-medium text-gray-800 truncate">{slot.patientName}</p>
                            <p className="text-[10px] text-gray-500 truncate capitalize">{slot.procedureType?.replace(/_/g, ' ')}</p>
                            {slot.noShowRisk >= 0.2 && (
                              <span className={cn('inline-block mt-0.5 text-[9px] font-semibold px-1 py-0.5 rounded', riskTextColor(slot.noShowRisk), riskBgColor(slot.noShowRisk))}>
                                {Math.round(slot.noShowRisk * 100)}% risk
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Floating tooltip */}
        {hoveredSlot && !hoveredSlot.isGap && (
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-64 pointer-events-none"
            style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 20 }}
          >
            <p className="text-sm font-semibold text-gray-900">{hoveredSlot.patientName}</p>
            <p className="text-xs text-gray-500 capitalize mt-0.5">{hoveredSlot.procedureType?.replace(/_/g, ' ')}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
              <Clock size={12} />
              {formatTime(hoveredSlot.startTime)} - {formatTime(hoveredSlot.endTime)} ({hoveredSlot.duration}m)
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn('text-xs font-semibold', riskTextColor(hoveredSlot.noShowRisk))}>
                {Math.round(hoveredSlot.noShowRisk * 100)}% no-show risk
              </span>
              <span className={cn('w-2 h-2 rounded-full', riskColor(hoveredSlot.noShowRisk))} />
            </div>
            {hoveredSlot.noShowRisk >= 0.3 && (
              <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle size={10} />
                {hoveredSlot.noShowRisk >= 0.5 ? 'Consider double-booking' : 'Send confirmation'}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // ---- No-Show Risk Panel ----
  const renderRiskPanel = () => {
    const highRisk = predictions.length > 0
      ? predictions
      : MOCK_DASHBOARD.topRiskAppointments;

    if (highRisk.length === 0) {
      return (
        <div className="card p-6 text-center">
          <Check size={32} className="mx-auto text-green-500 mb-2" />
          <p className="text-sm text-gray-600">No high-risk appointments today</p>
        </div>
      );
    }

    return (
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            High-Risk Appointments
          </h3>
          <span className="text-xs text-gray-400">{highRisk.length} flagged</span>
        </div>
        <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
          {highRisk.map((pred) => (
            <div key={pred.appointmentId} className="px-5 py-3 hover:bg-gray-50/60 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{pred.patientName}</p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">{pred.procedureType.replace(/_/g, ' ')} at {formatTime(pred.time)}</p>
                </div>
                <span className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded-full',
                  riskTextColor(pred.probability),
                  riskBgColor(pred.probability),
                )}>
                  {Math.round(pred.probability * 100)}%
                </span>
              </div>
              {pred.riskFactors.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {pred.riskFactors.map((rf, i) => (
                    <span key={i} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      {rf}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => handleConfirmAppointment(pred)}
                  className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <Phone size={10} /> Confirm
                </button>
                {pred.suggestedAction === 'double_book' && (
                  <button
                    onClick={() => handleOverbook(pred)}
                    className="text-xs px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex items-center gap-1"
                  >
                    <Plus size={10} /> Overbook
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ---- Waitlist Tab ----
  const renderWaitlist = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Patient Waitlist</h3>
        <button
          onClick={() => setShowWaitlistModal(true)}
          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
        >
          <UserPlus size={14} /> Add to Waitlist
        </button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Patient</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Procedure</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Preferred Times</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">Urgency</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">Wait Time</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">Status</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {waitlistData.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{entry.patientName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-gray-700">{entry.procedureType.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-400 ml-1">({entry.estimatedDuration}m)</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {entry.preferredDays.length > 0
                        ? entry.preferredDays.map((d) => (
                            <span key={d} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded capitalize">{d.slice(0, 3)}</span>
                          ))
                        : <span className="text-[10px] text-gray-400">Any day</span>
                      }
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded capitalize">{entry.preferredTimes}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize', urgencyBadge(entry.urgency))}>
                      {entry.urgency}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {daysSince(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize', statusBadge(entry.status))}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {entry.status === 'waiting' && (
                      <button
                        onClick={() => {
                          const updated = { ...entry, status: 'offered' as const };
                          setWaitlistData((prev) => prev.map((e) => (e.id === entry.id ? updated : e)));
                          toast.success(`Slot offered to ${entry.patientName}`);
                        }}
                        className="text-[11px] px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        Offer Slot
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {waitlistData.length === 0 && (
          <div className="py-10 text-center text-gray-400 text-sm">No patients on the waitlist</div>
        )}
      </div>
    </div>
  );

  // ---- Utilization Trends ----
  const renderTrends = () => {
    const chartData = weeklyData.map((d) => ({
      name: d.dayOfWeek.slice(0, 3),
      date: d.date,
      utilization: d.utilization,
      appointments: d.appointmentCount,
      revenue: d.revenueEstimate,
    }));

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Weekly Utilization Trends</h3>
        <div className="card p-5">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                formatter={(value: number, name: string) => {
                  if (name === 'utilization') return [`${value}%`, 'Utilization'];
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="utilization"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#6366f1' }}
                activeDot={{ r: 6 }}
                name="Utilization %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {weeklyData.filter((d) => d.utilization > 0).slice(-3).map((d) => (
            <div key={d.date} className="card p-4">
              <p className="text-xs text-gray-500">{d.dayOfWeek}, {d.date}</p>
              <p className="text-xl font-semibold text-gray-900 mt-1">{d.utilization}%</p>
              <p className="text-xs text-gray-400 mt-1">{d.appointmentCount} appointments / {formatCurrency(d.revenueEstimate)} est. revenue</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ---- Templates Tab ----
  const renderTemplates = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Schedule Templates</h3>
      <p className="text-xs text-gray-500">Revenue-maximizing daily schedule templates to optimize your chair time.</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {templates.map((tpl) => {
          const totalProcedures = tpl.procedures.reduce((s, p) => s + p.count, 0);
          return (
            <div key={tpl.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{tpl.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{tpl.description}</p>
                </div>
                <CalendarClock size={18} className="text-indigo-400 flex-shrink-0" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-semibold text-emerald-700">{formatCurrency(tpl.estimatedRevenue)}</p>
                  <p className="text-[10px] text-emerald-600">Est. Daily Revenue</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-semibold text-indigo-700">{tpl.estimatedUtilization}%</p>
                  <p className="text-[10px] text-indigo-600">Chair Utilization</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">Procedure Mix ({totalProcedures} total)</p>
                <div className="space-y-1.5">
                  {tpl.procedures.map((proc) => {
                    const pct = Math.round((proc.count / totalProcedures) * 100);
                    return (
                      <div key={proc.type} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-700">{proc.count}x {proc.type}</span>
                            <span className="text-gray-400">{formatCurrency(proc.avgRevenue)}/ea</span>
                          </div>
                          <div className="mt-0.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Info size={10} />
                  Recommended: {tpl.recommendedProviders.join(', ')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ---- Main render ----
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  const dateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Page header + date picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarClock size={22} className="text-indigo-600" />
            Predictive Scheduling
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-powered no-show predictions and chair utilization</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input text-sm py-1.5 px-3"
          />
          <button
            onClick={() => shiftDate(1)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setSelectedDate(todayStr())}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1"
          >
            Today
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 -mt-3">{dateLabel}</p>

      {/* Stat cards */}
      {renderStatCards()}

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {([
            { key: 'schedule', label: 'Schedule Grid', icon: <Armchair size={14} /> },
            { key: 'waitlist', label: 'Waitlist', icon: <Users size={14} /> },
            { key: 'trends', label: 'Utilization Trends', icon: <BarChart3 size={14} /> },
            { key: 'templates', label: 'Templates', icon: <CalendarClock size={14} /> },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 pb-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.key === 'waitlist' && (
                <span className="ml-1 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                  {waitlistData.filter((w) => w.status === 'waiting').length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          {renderScheduleGrid()}
          {renderRiskPanel()}
        </div>
      )}

      {activeTab === 'waitlist' && renderWaitlist()}
      {activeTab === 'trends' && renderTrends()}
      {activeTab === 'templates' && renderTemplates()}

      {/* Waitlist Modal */}
      <Modal isOpen={showWaitlistModal} onClose={() => setShowWaitlistModal(false)} title="Add to Waitlist" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Patient Name *</label>
            <input
              type="text"
              value={wlForm.patientName}
              onChange={(e) => setWlForm({ ...wlForm, patientName: e.target.value })}
              className="input w-full"
              placeholder="First Last"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Procedure *</label>
              <select
                value={wlForm.procedureType}
                onChange={(e) => setWlForm({ ...wlForm, procedureType: e.target.value })}
                className="input w-full"
              >
                <option value="hygiene">Hygiene</option>
                <option value="restorative">Restorative</option>
                <option value="crown">Crown</option>
                <option value="root_canal">Root Canal</option>
                <option value="extraction">Extraction</option>
                <option value="consultation">Consultation</option>
                <option value="exam">Exam</option>
                <option value="whitening">Whitening</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Est. Duration (min)</label>
              <input
                type="number"
                value={wlForm.estimatedDuration}
                onChange={(e) => setWlForm({ ...wlForm, estimatedDuration: parseInt(e.target.value) || 60 })}
                className="input w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Days</label>
            <div className="flex flex-wrap gap-1.5">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setWlForm((prev) => ({
                      ...prev,
                      preferredDays: prev.preferredDays.includes(day)
                        ? prev.preferredDays.filter((d) => d !== day)
                        : [...prev.preferredDays, day],
                    }));
                  }}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-md border transition-colors capitalize',
                    wlForm.preferredDays.includes(day)
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50',
                  )}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Time</label>
              <select
                value={wlForm.preferredTimes}
                onChange={(e) => setWlForm({ ...wlForm, preferredTimes: e.target.value })}
                className="input w-full"
              >
                <option value="any">Any</option>
                <option value="morning">Morning (8am-12pm)</option>
                <option value="afternoon">Afternoon (12pm-5pm)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Urgency</label>
              <select
                value={wlForm.urgency}
                onChange={(e) => setWlForm({ ...wlForm, urgency: e.target.value as 'routine' | 'soon' | 'urgent' })}
                className="input w-full"
              >
                <option value="routine">Routine</option>
                <option value="soon">Soon</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowWaitlistModal(false)}
              className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToWaitlist}
              className="btn-primary text-sm px-4 py-2"
            >
              Add to Waitlist
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
