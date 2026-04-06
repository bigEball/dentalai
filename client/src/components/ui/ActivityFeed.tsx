import React from 'react';
import {
  FileText,
  Shield,
  DollarSign,
  RefreshCw,
  Users,
  Activity,
} from 'lucide-react';
import type { ActivityLog } from '@/types';
import { formatDate } from '@/lib/utils';

interface ActivityFeedProps {
  activities: ActivityLog[];
}

function getActivityIcon(entityType: string) {
  switch (entityType.toLowerCase()) {
    case 'note':
    case 'clinical_note':
      return <FileText size={14} />;
    case 'insurance':
    case 'insurance_claim':
    case 'insurance_plan':
      return <Shield size={14} />;
    case 'billing':
    case 'balance':
      return <DollarSign size={14} />;
    case 'recall':
      return <RefreshCw size={14} />;
    case 'patient':
      return <Users size={14} />;
    default:
      return <Activity size={14} />;
  }
}

function getActivityColor(action: string): string {
  if (action.includes('approved') || action.includes('verified') || action.includes('paid')) {
    return 'bg-green-100 text-green-600';
  }
  if (action.includes('denied') || action.includes('failed') || action.includes('overdue')) {
    return 'bg-red-100 text-red-600';
  }
  if (action.includes('submitted') || action.includes('sent')) {
    return 'bg-blue-100 text-blue-600';
  }
  if (action.includes('generated') || action.includes('created')) {
    return 'bg-indigo-100 text-indigo-600';
  }
  return 'bg-gray-100 text-gray-500';
}

function timeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(timestamp);
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        No recent activity.
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-my-1">
        {activities.map((activity, idx) => (
          <li key={activity.id} className="relative">
            {idx < activities.length - 1 && (
              <span
                className="absolute left-4 top-8 bottom-0 w-px bg-gray-100"
                aria-hidden="true"
              />
            )}
            <div className="relative flex items-start gap-3 py-3">
              <div
                className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${getActivityColor(activity.action)}`}
              >
                {getActivityIcon(activity.entityType)}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm text-gray-700 leading-snug">
                  {activity.description}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {timeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
