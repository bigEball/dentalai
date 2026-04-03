import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  iconColor = 'text-indigo-600 bg-indigo-50',
  change,
  changeType = 'neutral',
  subtitle,
}: StatCardProps) {
  const changeIcon =
    changeType === 'positive' ? (
      <TrendingUp size={13} />
    ) : changeType === 'negative' ? (
      <TrendingDown size={13} />
    ) : (
      <Minus size={13} />
    );

  const changeColor =
    changeType === 'positive'
      ? 'text-green-600'
      : changeType === 'negative'
      ? 'text-red-500'
      : 'text-gray-500';

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900 tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400 truncate">{subtitle}</p>
          )}
          {change && (
            <p className={cn('mt-2 flex items-center gap-1 text-xs font-medium', changeColor)}>
              {changeIcon}
              {change}
            </p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-lg flex-shrink-0', iconColor)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
