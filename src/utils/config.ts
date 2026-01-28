import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { Language } from '../i18n/index.js';

export interface Config {
  language: Language;
  virustotal: {
    apiKey: string;
    enabled: boolean;
  };
  offline: boolean;
  cache: {
    ttl: number;
  };
}

const DEFAULT_VT_KEY = '3886ca2a3f7f9f42cb161f314cd1446fb7fd88e4097c5e004e1b64435d0726a9';

const defaultConfig: Config = {
  language: 'en',
  virustotal: {
    apiKey: DEFAULT_VT_KEY,
    enabled: true,
  },
  offline: false,
  cache: {
    ttl: 86400,
  },
};

function getConfigDir(): string {
  return join(homedir(), '.safe-npm');
}

function getConfigPath(): string {
  return join(getConfigDir(), 'config.json');
}

export function hasConfigFile(): boolean {
  return existsSync(getConfigPath());
}

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) return cachedConfig;

  const configPath = getConfigPath();

  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      const loaded = JSON.parse(content);

      cachedConfig = {
        ...defaultConfig,
        ...loaded,
        virustotal: {
          ...defaultConfig.virustotal,
          ...(loaded.virustotal || {})
        }
      };

      // Ensure API key is set (fallback to default if empty)
      if (!cachedConfig?.virustotal.apiKey) {
          // @ts-ignore
          cachedConfig.virustotal.apiKey = DEFAULT_VT_KEY;
      }

      return cachedConfig as Config;
    } catch {
      cachedConfig = defaultConfig;
      return cachedConfig;
    }
  }

  cachedConfig = defaultConfig;
  return cachedConfig;
}

export function saveConfig(config: Partial<Config>): void {
  const configDir = getConfigDir();
  const configPath = getConfigPath();

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  const newConfig = { ...getConfig(), ...config };
  writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
  cachedConfig = newConfig;
}

export function resetConfigCache(): void {
  cachedConfig = null;
}
