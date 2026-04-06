import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROLES, resolveRole } from '@/lib/roles';

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = resolveRole(user?.role);
  const roleLabel = ROLES[role].label;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <Lock size={28} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-sm text-gray-500 mb-1">
          You don't have access to this page.
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Current role: <span className="font-medium text-gray-600">{roleLabel}</span>
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary text-sm px-6 py-2.5"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
