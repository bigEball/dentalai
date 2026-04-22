import React, { useEffect, useState } from 'react';
import { Bell, Bot, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';
import { getSystemStatus, getSettings } from '@/lib/api';
import type { SystemStatus } from '@/lib/api';

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title }: TopBarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [officeOpen, setOfficeOpen] = useState(false);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [officeName, setOfficeName] = useState<string>('');

  useEffect(() => {
    getSystemStatus()
      .then(setStatus)
      .catch(() => setStatus({ mode: 'demo', openDentalConnected: false, ollamaAvailable: false }));
    getSettings()
      .then((cfg) => setOfficeName(cfg.office.name))
      .catch(() => setOfficeName(''));
  }, []);

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-4">
      {title && (
        <h2 className="text-sm font-semibold text-gray-900 flex-shrink-0 hidden lg:block">
          {title}
        </h2>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          onClick={() => navigate('/ai-assistant')}
          title="AI Assistant is a beta add-on for Open Dental and Summit AI Services workflow support."
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-100 bg-indigo-50 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
        >
          <Bot size={15} />
          <span className="hidden sm:inline">AI Assistant</span>
          <span className="rounded-full border border-indigo-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
            Beta
          </span>
          <span className="hidden md:inline rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            Add-on
          </span>
        </button>

        {status && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 mr-1">
            {status.mode === 'demo' ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-xs font-medium text-amber-700">Demo</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-green-700">
                  Live{officeName ? ` \u00b7 ${officeName}` : ''}
                </span>
              </>
            )}
          </div>
        )}

        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <div className="relative">
          <button
            onClick={() => setOfficeOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="hidden sm:block">{user?.office ?? 'Summit Demo Practice'}</span>
            <ChevronDown size={13} className="text-gray-400" />
          </button>
          {officeOpen && (
            <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 bg-indigo-50 text-indigo-600 font-medium"
                onClick={() => setOfficeOpen(false)}
              >
                {user?.office ?? 'Summit Demo Practice'}
              </button>
            </div>
          )}
        </div>

        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-white">
            {user
              ? getInitials(user.name.split(' ')[0] ?? '', user.name.split(' ')[1] ?? '')
              : 'DR'}
          </span>
        </div>
      </div>
    </header>
  );
}
