export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatPhone(phone: string): string {
  if (!phone) return '—';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function daysOverdue(dateStr: string): number {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function getCollectionStatusColor(status: string): string {
  switch (status) {
    case 'current':
      return 'bg-green-50 text-green-700';
    case 'overdue_30':
      return 'bg-yellow-50 text-yellow-700';
    case 'overdue_60':
      return 'bg-orange-50 text-orange-700';
    case 'overdue_90':
      return 'bg-red-50 text-red-700';
    case 'collections':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-50 text-gray-700';
  }
}

export function getClaimStatusColor(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-600';
    case 'pending':
      return 'bg-yellow-50 text-yellow-700';
    case 'submitted':
      return 'bg-blue-50 text-blue-700';
    case 'approved':
      return 'bg-green-50 text-green-700';
    case 'denied':
      return 'bg-red-50 text-red-700';
    case 'resubmit':
      return 'bg-orange-50 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export function getNoteStatusColor(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-600';
    case 'pending_approval':
      return 'bg-yellow-50 text-yellow-700';
    case 'approved':
      return 'bg-green-50 text-green-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export function getVerificationStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-50 text-yellow-700';
    case 'verified':
      return 'bg-green-50 text-green-700';
    case 'failed':
      return 'bg-red-50 text-red-700';
    case 'expired':
      return 'bg-orange-50 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export function getRecallStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-50 text-yellow-700';
    case 'contacted':
      return 'bg-blue-50 text-blue-700';
    case 'scheduled':
      return 'bg-green-50 text-green-700';
    case 'declined':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}
