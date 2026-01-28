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

const defaultConfig: Config = {
  language: 'en',
  virustotal: {
    apiKey: '',
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

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) return cachedConfig;

  const configPath = getConfigPath();

  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      cachedConfig = { ...defaultConfig, ...JSON.parse(content) };
      return cachedConfig;
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
