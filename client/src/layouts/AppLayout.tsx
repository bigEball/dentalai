import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/': 'Dashboard',
  '/patients': 'Patients',
  '/notes': 'AI Notes',
  '/insurance': 'Insurance',
  '/billing': 'Billing',
  '/recall': 'Recall',
  '/radiographs': 'Radiographs',
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
