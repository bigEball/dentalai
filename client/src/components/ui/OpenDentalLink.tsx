import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getSettings } from '@/lib/api';

const DEFAULT_SERVER_URL = 'http://localhost:30222';

let cachedServerUrl: string | null = null;

function useOpenDentalUrl() {
  const [serverUrl, setServerUrl] = useState(cachedServerUrl ?? DEFAULT_SERVER_URL);

  useEffect(() => {
    if (cachedServerUrl) return;
    getSettings()
      .then((cfg) => {
        const url = cfg.openDental.serverUrl || DEFAULT_SERVER_URL;
        cachedServerUrl = url;
        setServerUrl(url);
      })
      .catch(() => {});
  }, []);

  return serverUrl;
}

interface OpenDentalLinkProps {
  patientId: string;
  className?: string;
}

export default function OpenDentalLink({ patientId, className = '' }: OpenDentalLinkProps) {
  const serverUrl = useOpenDentalUrl();
  const base = serverUrl.replace(/\/+$/, '');
  const href = `${base}/api/v1/patients/${patientId}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Open in OpenDental"
      className={`inline-flex items-center justify-center p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex-shrink-0 ${className}`}
    >
      <ExternalLink size={14} />
    </a>
  );
}
