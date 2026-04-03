import React from 'react';
import {
  getClaimStatusColor,
  getNoteStatusColor,
  getVerificationStatusColor,
  getCollectionStatusColor,
  getRecallStatusColor,
} from '@/lib/utils';
import { cn } from '@/lib/utils';

interface BadgeProps {
  status: string;
  variant?: 'claim' | 'note' | 'verification' | 'collection' | 'recall';
  className?: string;
}

function labelFor(status: string, variant?: BadgeProps['variant']): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    pending: 'Pending',
    pending_approval: 'Pending Approval',
    submitted: 'Submitted',
    approved: 'Approved',
    denied: 'Denied',
    resubmit: 'Resubmit',
    verified: 'Verified',
    failed: 'Failed',
    expired: 'Expired',
    current: 'Current',
    overdue_30: '30+ Days',
    overdue_60: '60+ Days',
    overdue_90: '90+ Days',
    collections: 'Collections',
    contacted: 'Contacted',
    scheduled: 'Scheduled',
    declined: 'Declined',
  };
  return labels[status] ?? status;
}

export default function Badge({ status, variant, className }: BadgeProps) {
  let colorClass = 'bg-gray-100 text-gray-600';

  switch (variant) {
    case 'claim':
      colorClass = getClaimStatusColor(status);
      break;
    case 'note':
      colorClass = getNoteStatusColor(status);
      break;
    case 'verification':
      colorClass = getVerificationStatusColor(status);
      break;
    case 'collection':
      colorClass = getCollectionStatusColor(status);
      break;
    case 'recall':
      colorClass = getRecallStatusColor(status);
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-600';
  }

  return (
    <span className={cn('badge', colorClass, className)}>
      {labelFor(status, variant)}
    </span>
  );
}
