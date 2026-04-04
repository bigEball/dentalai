import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/': 'Dashboard',
  '/patients': 'Patients',
  '/calendar': 'Calendar',
  '/notes': 'AI Notes',
  '/treatment-plans': 'Treatment Plans',
  '/insurance': 'Insurance',
  '/preauth': 'Pre-Authorizations',
  '/billing': 'Billing',
  '/payment-plans': 'Payment Plans',
  '/recall': 'Recall',
  '/radiographs': 'Radiographs',
  '/perio': 'Perio Charting',
  '/communications': 'Communications',
  '/follow-ups': 'Follow-Ups',
  '/referrals': 'Referrals',
  '/forms': 'Patient Forms',
  '/inventory': 'Inventory',
  '/reports': 'Reports & Analytics',
  '/patient-scores': 'Patient Scores',
  '/compliance': 'Compliance',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? '';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-h-0 overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
