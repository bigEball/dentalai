/**
 * Application config manager.
 *
 * Reads/writes a JSON config file at <project-root>/data/config.json.
 * Provides typed access to all configuration with safe defaults.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface AppConfig {
  mode: 'demo' | 'live';
  openDental: {
    serverUrl: string;
    developerKey: string;
    customerKey: string;
  };
  ollama: {
    url: string;
    model: string;
    enabled: boolean;
  };
  whisper: {
    modelPath: string;
    enabled: boolean;
  };
  priceSearch: {
    serpApiKey: string;
    enabled: boolean;
  };
  office: {
    name: string;
    locations: string[];
    timezone: string;
  };
  modules: {
    aiNotes: boolean;
    insurance: boolean;
    billing: boolean;
    recall: boolean;
  };
}

// ----------------------------------------------------------------
// Defaults
// ----------------------------------------------------------------

const DEFAULT_CONFIG: AppConfig = {
  mode: 'demo',
  openDental: {
    serverUrl: 'http://localhost:30222/api/v1/',
    developerKey: '',
    customerKey: '',
  },
  ollama: {
    url: 'http://localhost:11434',
    model: 'qwen2.5:14b',
    enabled: true,
  },
  whisper: {
    modelPath: '',
    enabled: false,
  },
  priceSearch: {
    serpApiKey: '',
    enabled: true,
  },
  office: {
    name: 'Bright Smiles Dental',
    locations: ['Main Street Office', 'Westside Office'],
    timezone: 'America/Chicago',
  },
  modules: {
    aiNotes: true,
    insurance: true,
    billing: true,
    recall: true,
  },
};

// ----------------------------------------------------------------
// Config file path — data/config.json relative to the project root.
// The data/ directory sits next to the prisma/ directory.
// ----------------------------------------------------------------

const CONFIG_PATH = resolve(__dirname, '..', '..', '..', 'data', 'config.json');

// ----------------------------------------------------------------
// Deep merge utility
// ----------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(target: any, source: any): any {
  if (
    source === null ||
    source === undefined ||
    typeof source !== 'object' ||
    Array.isArray(source)
  ) {
    return source;
  }

  const result = { ...target };

  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = result[key];

    if (
      sourceVal !== null &&
      sourceVal !== undefined &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === 'object' &&
      targetVal !== null &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(targetVal, sourceVal);
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }

  return result;
}

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

/**
 * Read the config from disk. Returns defaults if the file does not exist
 * or cannot be parsed.
 */
export function getConfig(): AppConfig {
  try {
    if (!existsSync(CONFIG_PATH)) {
      return { ...DEFAULT_CONFIG };
    }
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return deepMerge(DEFAULT_CONFIG, parsed) as AppConfig;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Deep-merge partial updates into the existing config, write to disk,
 * and return the updated config.
 */
export function updateConfig(partial: Partial<AppConfig>): AppConfig {
  const current = getConfig();
  const merged = deepMerge(current, partial) as AppConfig;

  const dir = dirname(CONFIG_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

/**
 * Get the current operating mode.
 */
export function getMode(): 'demo' | 'live' {
  return getConfig().mode;
}

/**
 * Check if the app is running in live (Open Dental connected) mode.
 */
export function isLiveMode(): boolean {
  return getConfig().mode === 'live';
}
