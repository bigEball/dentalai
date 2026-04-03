import React, { useEffect, useState } from 'react';
import {
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  ToggleRight,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Terminal,
  Monitor,
  Play,
  Eye,
  EyeOff,
  Cpu,
  Mic,
  Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  getSettings,
  updateSettings,
  testConnection,
  triggerSync,
  switchMode,
  getSystemStatus,
} from '@/lib/api';
import type { AppConfig, SystemStatus } from '@/lib/api';

const DEFAULT_SETTINGS: AppConfig = {
  mode: 'demo',
  openDental: {
    serverUrl: 'http://localhost:30222',
    developerKey: '',
    customerKey: '',
  },
  ollama: {
    url: 'http://localhost:11434',
    model: 'qwen2.5:14b',
    enabled: false,
  },
  whisper: {
    modelPath: '',
    enabled: false,
  },
  modules: {
    aiNotes: true,
    insurance: true,
    billing: true,
    recall: true,
    radiographs: true,
  },
  office: {
    name: 'Bright Smiles Dental',
    locations: ['Main Street Office', 'Westside Office'],
    timezone: 'America/Chicago',
  },
};

const DEFAULT_STATUS: SystemStatus = {
  mode: 'demo',
  openDentalConnected: false,
  ollamaAvailable: false,
};

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
];

const SYNC_LOG_DEFAULT = [
  { time: 'Never', message: 'No sync completed. Configure Open Dental integration to enable.' },
];

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

function ToggleSwitch({ enabled, onChange, label, description }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-b-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function PasswordField({ label, value, onChange, placeholder, disabled }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`input pr-10 ${disabled ? 'bg-gray-50 text-gray-400' : ''}`}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppConfig>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<SystemStatus>(DEFAULT_STATUS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean; message: string } | null>(null);
  const [syncLog, setSyncLog] = useState(SYNC_LOG_DEFAULT);

  useEffect(() => {
    Promise.all([
      getSettings().catch(() => DEFAULT_SETTINGS),
      getSystemStatus().catch(() => DEFAULT_STATUS),
    ])
      .then(([cfg, sys]) => {
        setSettings(cfg);
        setStatus(sys);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSwitchMode(mode: 'demo' | 'live') {
    if (mode === settings.mode) return;

    if (mode === 'live' && !settings.openDental.developerKey && !settings.openDental.customerKey) {
      const confirmed = window.confirm(
        'Switching to Live mode requires valid Open Dental credentials (Developer Key and Customer Key). Continue?',
      );
      if (!confirmed) return;
    }

    setSwitchingMode(true);
    try {
      const updated = await switchMode(mode);
      setSettings(updated);
      setStatus((prev) => ({ ...prev, mode }));
      toast.success(`Switched to ${mode === 'demo' ? 'Demo' : 'Live'} mode`);
    } catch {
      setSettings((prev) => ({ ...prev, mode }));
      setStatus((prev) => ({ ...prev, mode }));
      toast.success(`Switched to ${mode === 'demo' ? 'Demo' : 'Live'} mode`);
    } finally {
      setSwitchingMode(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success('Settings saved');
    } catch {
      toast.success('Settings saved (demo mode)');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection();
      setTestResult(result);
      if (result.connected) {
        toast.success('Connection successful!');
        setStatus((prev) => ({ ...prev, openDentalConnected: true }));
      } else {
        toast.error(result.message);
      }
    } catch {
      const result = {
        connected: false,
        message: 'Cannot connect -- Open Dental is not configured. Production license required.',
      };
      setTestResult(result);
      toast.error('Connection failed (demo mode)');
    } finally {
      setTesting(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await triggerSync();
      toast.success('Sync completed');
      setSyncLog([
        { time: new Date().toLocaleString(), message: 'Manual sync triggered -- demo mode (no data imported).' },
        ...syncLog,
      ]);
    } catch {
      toast('Sync attempted (demo mode -- no Open Dental connection)', { icon: 'i' });
      setSyncLog([
        { time: new Date().toLocaleString(), message: 'Manual sync attempted -- no connection available in demo mode.' },
        ...syncLog,
      ]);
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  const isLive = settings.mode === 'live';

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure DentalAI integrations and preferences</p>
      </div>

      <div className="space-y-5">
        {/* ── Section 1: Mode Switcher ── */}
        <div className="card p-6 border-2 border-indigo-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Monitor size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Operating Mode</h2>
              <p className="text-xs text-gray-500 mt-0.5">Choose how DentalAI connects to your practice</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Demo card */}
            <button
              onClick={() => handleSwitchMode('demo')}
              disabled={switchingMode}
              className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                !isLive
                  ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {!isLive && (
                <span className="absolute top-3 right-3 h-3 w-3 rounded-full bg-amber-400" />
              )}
              <p className="text-sm font-semibold text-gray-900 mb-1">Demo Mode</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Using simulated dental office data. No external connections required.
              </p>
            </button>

            {/* Live card */}
            <button
              onClick={() => handleSwitchMode('live')}
              disabled={switchingMode}
              className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                isLive
                  ? 'border-green-400 bg-green-50 ring-2 ring-green-200'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {isLive && (
                <span className="absolute top-3 right-3 h-3 w-3 rounded-full bg-green-500" />
              )}
              <p className="text-sm font-semibold text-gray-900 mb-1">Live Mode</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Connected to Open Dental. Real patient data, real-time sync.
              </p>
            </button>
          </div>

          {switchingMode && (
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
              <Loader2 size={12} className="animate-spin" />
              Switching mode...
            </div>
          )}
        </div>

        {/* ── Section 2: Open Dental Connection ── */}
        <div className={`card p-6 transition-opacity ${isLive ? 'opacity-100' : 'opacity-50'}`}>
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Database size={20} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Open Dental Connection</h2>
                <p className="text-xs text-gray-500 mt-0.5">Connect to your Open Dental database</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  status.openDentalConnected ? 'bg-green-500' : isLive ? 'bg-red-500' : 'bg-gray-400'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  status.openDentalConnected ? 'text-green-700' : isLive ? 'text-red-600' : 'text-gray-400'
                }`}
              >
                {status.openDentalConnected ? 'Connected' : isLive ? 'Not Connected' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Server URL</label>
              <input
                type="text"
                value={settings.openDental.serverUrl}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    openDental: { ...p.openDental, serverUrl: e.target.value },
                  }))
                }
                className={`input ${!isLive ? 'bg-gray-50 text-gray-400' : ''}`}
                placeholder="http://localhost:30222"
                disabled={!isLive}
              />
            </div>

            <PasswordField
              label="Developer Key"
              value={settings.openDental.developerKey}
              onChange={(v) =>
                setSettings((p) => ({
                  ...p,
                  openDental: { ...p.openDental, developerKey: v },
                }))
              }
              placeholder="Enter your developer key"
              disabled={!isLive}
            />

            <PasswordField
              label="Customer Key"
              value={settings.openDental.customerKey}
              onChange={(v) =>
                setSettings((p) => ({
                  ...p,
                  openDental: { ...p.openDental, customerKey: v },
                }))
              }
              placeholder="Enter your customer key"
              disabled={!isLive}
            />
          </div>

          {testResult && (
            <div
              className={`mb-4 p-3 rounded-lg border flex items-center gap-2 ${
                testResult.connected
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              {testResult.connected ? (
                <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
              )}
              <p
                className={`text-xs ${
                  testResult.connected ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {testResult.message}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleTestConnection}
              disabled={testing || !isLive}
              className="btn-primary text-sm"
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />}
              Test Connection
            </button>
            <button
              onClick={handleSync}
              disabled={syncing || !isLive}
              className="btn-secondary text-sm"
            >
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Sync Now
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Connection status</span>
              <span className="flex items-center gap-1 text-gray-500">
                {status.openDentalConnected ? (
                  <>
                    <Wifi size={11} className="text-green-500" />
                    Connected
                  </>
                ) : (
                  <>
                    <WifiOff size={11} />
                    {isLive ? 'Disconnected' : 'Inactive -- demo mode'}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* ── Section 3: AI Services ── */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Cpu size={20} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">AI Services</h2>
              <p className="text-xs text-gray-500 mt-0.5">Local AI model configuration</p>
            </div>
          </div>

          {/* Ollama */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Play size={14} className="text-violet-600" />
                <span className="text-sm font-medium text-gray-900">Ollama</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    status.ollamaAvailable ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    status.ollamaAvailable ? 'text-green-700' : 'text-red-600'
                  }`}
                >
                  {status.ollamaAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Ollama URL</label>
                <input
                  type="text"
                  value={settings.ollama.url}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      ollama: { ...p.ollama, url: e.target.value },
                    }))
                  }
                  className="input"
                  placeholder="http://localhost:11434"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Model</label>
                <input
                  type="text"
                  value={settings.ollama.model}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      ollama: { ...p.ollama, model: e.target.value },
                    }))
                  }
                  className="input"
                  placeholder="qwen2.5:14b"
                />
              </div>
            </div>
          </div>

          {/* Whisper */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic size={14} className="text-violet-600" />
                <span className="text-sm font-medium text-gray-900">Whisper Speech-to-Text</span>
              </div>
              <span className="badge bg-gray-100 text-gray-500 text-[10px]">Coming Soon</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 ml-6">
              Local speech recognition for clinical note transcription.
            </p>
          </div>
        </div>

        {/* ── Section 4: Modules ── */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <ToggleRight size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Modules</h2>
              <p className="text-xs text-gray-500 mt-0.5">Enable or disable AI features</p>
            </div>
          </div>

          <ToggleSwitch
            enabled={settings.modules.aiNotes}
            onChange={(v) => setSettings((p) => ({ ...p, modules: { ...p.modules, aiNotes: v } }))}
            label="AI Clinical Notes"
            description="Generate SOAP notes from transcripts"
          />
          <ToggleSwitch
            enabled={settings.modules.insurance}
            onChange={(v) => setSettings((p) => ({ ...p, modules: { ...p.modules, insurance: v } }))}
            label="Insurance Management"
            description="Verification and claims automation"
          />
          <ToggleSwitch
            enabled={settings.modules.billing}
            onChange={(v) => setSettings((p) => ({ ...p, modules: { ...p.modules, billing: v } }))}
            label="Billing & Collections"
            description="Patient balance tracking and statements"
          />
          <ToggleSwitch
            enabled={settings.modules.recall}
            onChange={(v) => setSettings((p) => ({ ...p, modules: { ...p.modules, recall: v } }))}
            label="Recall Automation"
            description="AI-suggested hygiene recall messaging"
          />
          <ToggleSwitch
            enabled={settings.modules.radiographs}
            onChange={(v) => setSettings((p) => ({ ...p, modules: { ...p.modules, radiographs: v } }))}
            label="Radiograph Review"
            description="AI-assisted X-ray findings"
          />
        </div>

        {/* ── Section 5: Office Settings ── */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Office Settings</h2>
              <p className="text-xs text-gray-500 mt-0.5">General office configuration</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Office Name</label>
              <input
                type="text"
                value={settings.office.name}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, office: { ...p.office, name: e.target.value } }))
                }
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Timezone</label>
              <select
                value={settings.office.timezone}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, office: { ...p.office, timezone: e.target.value } }))
                }
                className="input"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Locations</label>
              <div className="space-y-2">
                {settings.office.locations.map((loc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-700">{loc}</span>
                    <span
                      className={`badge ${
                        i === 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {i === 0 ? 'Primary' : 'Branch'}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => toast('Multi-location management requires Pro plan', { icon: 'i' })}
                className="btn-ghost text-xs mt-2"
              >
                + Add location
              </button>
            </div>
          </div>
        </div>

        {/* ── Section 6: Data Sync ── */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <RefreshCw size={20} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Data Sync</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manual sync from Open Dental</p>
              </div>
            </div>
            <button onClick={handleSync} disabled={syncing} className="btn-secondary text-sm">
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>

          <div className="rounded-xl bg-gray-900 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Terminal size={13} className="text-gray-400" />
              <span className="text-xs text-gray-400 font-mono">Sync Log</span>
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              {syncLog.map((entry, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-gray-600 flex-shrink-0">[{entry.time}]</span>
                  <span className="text-gray-400">{entry.message}</span>
                </div>
              ))}
              {syncing && (
                <div className="flex items-center gap-2 text-indigo-400">
                  <Loader2 size={10} className="animate-spin" />
                  <span>Sync in progress...</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
            <p className="text-xs text-indigo-700 font-medium">
              Automatic sync available with Pro plan
            </p>
            <p className="text-xs text-indigo-600 mt-0.5">
              Connect Open Dental to enable real-time patient, appointment, and billing data sync.
            </p>
          </div>
        </div>

        {/* ── Save Button ── */}
        <div className="flex gap-2 pb-6">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
