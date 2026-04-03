import React, { useEffect, useState, useCallback } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getCalendarAppointments, getCalendarProviders } from '@/lib/api';
import type { Appointment, Provider } from '@/types';
import { cn } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';

const MOCK_PROVIDERS: Provider[] = [
  { id: 'prov1', firstName: 'Sarah', lastName: 'Mitchell', title: 'DDS', specialty: 'General' },
  { id: 'prov2', firstName: 'James', lastName: 'Park', title: 'DMD', specialty: 'Prosthodontics' },
  { id: 'prov3', firstName: 'Lisa', lastName: 'Nguyen', title: 'RDH', specialty: 'Hygiene' },
];

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h <= 17; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 17) {
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
  }
  return slots;
}

function formatTime(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr} ${suffix}`;
}

function slotIndex(time24: string): number {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  return (h - 8) * 2 + (m >= 30 ? 1 : 0);
}

function statusColor(status: string): { bg: string; border: string; text: string } {
  switch (status) {
    case 'scheduled':
      return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800' };
    case 'completed':
      return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800' };
    case 'cancelled':
      return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-500' };
    case 'no-show':
      return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800' };
    default:
      return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-600' };
  }
}

function providerColor(index: number): string {
  const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600', 'bg-rose-600'];
  return colors[index % colors.length];
}

function providerBgLight(index: number): string {
  const colors = ['bg-indigo-50 border-indigo-200', 'bg-emerald-50 border-emerald-200', 'bg-amber-50 border-amber-200', 'bg-purple-50 border-purple-200', 'bg-rose-50 border-rose-200'];
  return colors[index % colors.length];
}

function providerTextColor(index: number): string {
  const colors = ['text-indigo-800', 'text-emerald-800', 'text-amber-800', 'text-purple-800', 'text-rose-800'];
  return colors[index % colors.length];
}

function makeMockAppointments(dateStr: string): Appointment[] {
  return [
    { id: 'a1', patientId: 'p1', providerId: 'prov1', date: dateStr, time: '08:00', duration: 60, type: 'New Patient Exam', status: 'scheduled', patient: { id: 'p1', firstName: 'Jane', lastName: 'Cooper', dateOfBirth: '1985-07-22', phone: '5551234567', email: 'jane.cooper@email.com', preferredContactMethod: 'email', outstandingBalance: 0, createdAt: '', updatedAt: '' }, provider: MOCK_PROVIDERS[0] },
    { id: 'a2', patientId: 'p2', providerId: 'prov3', date: dateStr, time: '08:30', duration: 60, type: 'Prophylaxis', status: 'scheduled', patient: { id: 'p2', firstName: 'Robert', lastName: 'Chen', dateOfBirth: '1972-03-15', phone: '5559876543', email: 'r.chen@email.com', preferredContactMethod: 'text', outstandingBalance: 336, createdAt: '', updatedAt: '' }, provider: MOCK_PROVIDERS[2] },
    { id: 'a3', patientId: 'p3', providerId: 'prov1', date: dateStr, time: '09:30', duration: 90, type: 'Crown Prep', status: 'scheduled', patient: { id: 'p3', firstName: 'Maria', lastName: 'Garcia', dateOfBirth: '1992-11-08', phone: '5551238765', email: 'maria.g@email.com', preferredContactMethod: 'phone', outstandingBalance: 680.5, createdAt: '', updatedAt: '' }, provider: MOCK_PROVIDERS[0] },
    { id: 'a4', patientId: 'p4', providerId: 'prov2', date: dateStr, time: '10:00', duration: 60, type: 'Implant Consult', status: 'completed', patient: { id: 'p4', firstName: 'Ethan', lastName: 'Williams', dateOfBirth: '2014-09-01', phone: '5554561234', email: 'williams.fam@email.com', preferredContactMethod: 'email', outstandingBalance: 0, createdAt: '', updatedAt: '' }, provider: MOCK_PROVIDERS[1] },
    { id: 'a5', patientId: 'p5', providerId: 'prov3', date: dateStr, time: '10:00', duration: 60, type: 'Perio Maintenance', status: 'scheduled', patient: { id: 'p5', firstName: 'Michael', lastName: 'Torres', dateOfBirth: '1989-09-12', phone: '5552229988', email: 'mtorres@email.com', preferredContactMethod: 'text', outstandingBalance: 2840, createdAt: '', updatedAt: '' }, provider: MOCK_PROVIDERS[2] },
    { id: 'a6', patientId: 'p6', providerId: 'prov1', date: dateStr, time: '11:30', duration: 30, type: 'Post-Op Check', status: 'scheduled', patient: { id: 'p6', firstName: 'Emily', lastName: 'Johnson', dateOfBirth: '1994-02-28', phone: '5558884455', email: 'emily.j@email.com', preferredContactMethod: 'email', outstandingBalance: 350, createdAt: '', updatedAt: '' }, provider: MOCK_PROVIDERS[0] },
    { id: 'a7', patientId: 'p7', providerId: 'prov2', date: dateStr, time: '13:00', duration: 120, type: 'Veneer Placement', status: 'scheduled', patient: { id: 'p7', firstName: 'Sarah', lastName: 'Kim', dateOfBirth: '1990-04-12', phone: '5556667788', email: 'sarah.kim@email.com', preferredContactMethod: 'email', outstandingBalance: 1920.5, createdAt: '', updatedAt: '' }, provider: MOCK_PROVIDERS[1] },
    { id: 'a8', patientId: 'p8', providerId: 'prov3', date: dateStr, time: '13:30', duration: 60, type: 'Prophylaxis', status: 'no-show', patient: { id: 'p8', firstName: 'David', lastName: 'Park', dateOfBirth: '1975-08-22', phone: '5554449900', email: 'd.park@email.com', preferredContactMethod: 'phone', outstandingBalance: 1450, createdAt: '', updatedAt: '' }, provider: MOCK_PROVIDERS[2] },
    { id: 'a9', patientId: 'p9', providerId: 'prov1', date: dateStr, time: '14:00', duration: 60, type: 'Filling — MOD', status: 'scheduled', patient: { id: 'p9', firstName: 'Amanda', lastName: 'Chen', dateOfBirth: '1988-06-14', phone: '5551112233', email: 'amanda.c@email.com', preferredContactMethod: 'text', outstandingBalance: 980.75, createdAt: '', updatedAt: '' }, provider: MOCK_PROVIDERS[0] },
    { id: 'a10', patientId: 'p10', providerId: 'prov1', date: dateStr, time: '15:30', duration: 30, type: 'Emergency Exam', status: 'cancelled', patient: { id: 'p10', firstName: 'James', lastName: 'Wilson', dateOfBirth: '1960-01-15', phone: '5559990011', email: 'j.wilson@email.com', preferredContactMethod: 'phone', outstandingBalance: 4200, createdAt: '', updatedAt: '' }, provider: MOCK_PROVIDERS[0] },
  ];
}

const TIME_SLOTS = generateTimeSlots();

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [apptResult, provResult] = await Promise.all([
        getCalendarAppointments({ start: selectedDate, end: selectedDate, providerId: selectedProvider || undefined }),
        getCalendarProviders(),
      ]);
      setAppointments(apptResult.appointments);
      setProviders(provResult);
    } catch {
      setAppointments(
        selectedProvider
          ? makeMockAppointments(selectedDate).filter((a) => a.providerId === selectedProvider)
          : makeMockAppointments(selectedDate),
      );
      setProviders(MOCK_PROVIDERS);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedProvider]);

  useEffect(() => { loadData(); }, [loadData]);

  const isToday = selectedDate === todayStr();

  const filteredAppointments = selectedProvider
    ? appointments.filter((a) => a.providerId === selectedProvider)
    : appointments;

  // Build a lookup: providerId -> index for coloring
  const providerIndexMap = new Map<string, number>();
  providers.forEach((p, i) => providerIndexMap.set(p.id, i));

  // Group appointments by time slot for rendering
  function appointmentsAtSlot(slotTime: string): Appointment[] {
    return filteredAppointments.filter((a) => a.time === slotTime);
  }

  // Determine how many 30-min slots an appointment spans
  function slotSpan(duration: number): number {
    return Math.max(1, Math.ceil(duration / 30));
  }

  // Build set of slot times that are "covered" by multi-slot appointments starting earlier
  const coveredSlots = new Set<string>();
  filteredAppointments.forEach((a) => {
    const span = slotSpan(a.duration);
    if (span > 1) {
      const startIdx = slotIndex(a.time);
      for (let i = 1; i < span; i++) {
        const coveredIdx = startIdx + i;
        if (coveredIdx < TIME_SLOTS.length) {
          // Track appointmentId + slot to know this is covered
          coveredSlots.add(`${a.id}:${TIME_SLOTS[coveredIdx]}`);
        }
      }
    }
  });

  // Check if a slot time is covered by any earlier appointment (should be skipped in rendering)
  function isSlotCoveredByEarlier(slotTime: string): boolean {
    return filteredAppointments.some((a) => {
      const span = slotSpan(a.duration);
      if (span <= 1) return false;
      const startIdx = slotIndex(a.time);
      const thisIdx = slotIndex(slotTime);
      return thisIdx > startIdx && thisIdx < startIdx + span;
    });
  }

  const summaryStats = {
    total: filteredAppointments.length,
    scheduled: filteredAppointments.filter((a) => a.status === 'scheduled').length,
    completed: filteredAppointments.filter((a) => a.status === 'completed').length,
    cancelled: filteredAppointments.filter((a) => a.status === 'cancelled').length,
    noShow: filteredAppointments.filter((a) => a.status === 'no-show').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Calendar size={24} className="text-indigo-600" />
          Calendar
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {summaryStats.total} appointment{summaryStats.total !== 1 ? 's' : ''} today
          {summaryStats.noShow > 0 && (
            <span className="text-red-500 ml-1">
              ({summaryStats.noShow} no-show)
            </span>
          )}
        </p>
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setSelectedDate(todayStr())}
            disabled={isToday}
            className={cn(
              'px-4 py-2 text-xs font-medium rounded-lg border transition-colors',
              isToday
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
            )}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          <h2 className="text-base font-semibold text-gray-900 ml-3">
            {formatDisplayDate(selectedDate)}
          </h2>
        </div>
      </div>

      {/* Provider filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setSelectedProvider('')}
          className={cn(
            'px-4 py-1.5 text-xs font-medium rounded-full border transition-all',
            selectedProvider === ''
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
          )}
        >
          All Providers
        </button>
        {providers.map((prov, idx) => (
          <button
            key={prov.id}
            onClick={() => setSelectedProvider(selectedProvider === prov.id ? '' : prov.id)}
            className={cn(
              'px-4 py-1.5 text-xs font-medium rounded-full border transition-all inline-flex items-center gap-2',
              selectedProvider === prov.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
            )}
          >
            <span className={cn('w-2.5 h-2.5 rounded-full', providerColor(idx))} />
            {prov.firstName} {prov.lastName}, {prov.title}
          </button>
        ))}
      </div>

      {/* Day schedule */}
      {loading ? (
        <FullPageSpinner />
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100">
            {TIME_SLOTS.map((slotTime) => {
              // Skip slots that are mid-appointment
              if (isSlotCoveredByEarlier(slotTime)) return null;

              const slotAppts = appointmentsAtSlot(slotTime);
              const isHour = slotTime.endsWith(':00');

              return (
                <div
                  key={slotTime}
                  className={cn(
                    'flex min-h-[56px]',
                    isHour ? 'bg-white' : 'bg-gray-50/30',
                  )}
                >
                  {/* Time label */}
                  <div className="w-20 flex-shrink-0 px-4 py-3 text-right border-r border-gray-100">
                    <span className={cn(
                      'text-xs tabular-nums',
                      isHour ? 'font-semibold text-gray-700' : 'text-gray-400',
                    )}>
                      {formatTime(slotTime)}
                    </span>
                  </div>

                  {/* Appointments */}
                  <div className="flex-1 px-3 py-2 flex gap-2 flex-wrap">
                    {slotAppts.map((appt) => {
                      const sc = statusColor(appt.status);
                      const provIdx = providerIndexMap.get(appt.providerId) ?? 0;
                      const span = slotSpan(appt.duration);

                      return (
                        <div
                          key={appt.id}
                          className={cn(
                            'flex-1 min-w-[200px] max-w-md rounded-lg border px-3 py-2 transition-shadow hover:shadow-sm',
                            sc.bg,
                            sc.border,
                          )}
                          style={span > 1 ? { minHeight: `${span * 56 - 16}px` } : undefined}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', providerColor(provIdx))} />
                                <p className={cn('text-sm font-semibold truncate', sc.text)}>
                                  {appt.patient?.firstName} {appt.patient?.lastName}
                                </p>
                              </div>
                              <p className={cn('text-xs mt-0.5 truncate', sc.text, 'opacity-80')}>
                                {appt.type}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Clock size={12} className={cn(sc.text, 'opacity-60')} />
                              <span className={cn('text-[10px] font-medium', sc.text, 'opacity-70')}>
                                {appt.duration}m
                              </span>
                            </div>
                          </div>
                          {appt.provider && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <User size={10} className="text-gray-400" />
                              <span className="text-[10px] text-gray-500">
                                {appt.provider.firstName} {appt.provider.lastName}
                              </span>
                            </div>
                          )}
                          {appt.status !== 'scheduled' && (
                            <div className="mt-1">
                              <span className={cn(
                                'inline-block text-[10px] font-medium px-1.5 py-0.5 rounded',
                                appt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                appt.status === 'cancelled' ? 'bg-gray-200 text-gray-600' :
                                appt.status === 'no-show' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-600',
                              )}>
                                {appt.status === 'no-show' ? 'No Show' : appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
