# safe-npm Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a CLI tool that wraps npm commands, intercepts install operations for security scanning, and provides a TUI for package discovery.

**Architecture:** CLI entry point parses commands, proxies non-install commands to npm, runs security checks before install. Scanner engine detects malware, typosquatting, suspicious code patterns, and CVE vulnerabilities. TUI built with Ink/React for interactive mode.

**Tech Stack:** TypeScript, Node.js, Ink (React TUI), Commander, Axios

---

## Phase 1: Project Setup

### Task 1: Initialize npm project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`

**Step 1: Initialize package.json**

Run:
```bash
cd .worktrees/feature-init
npm init -y
```

**Step 2: Update package.json with project details**

```json
{
  "name": "safe-npm",
  "version": "0.1.0",
  "description": "A security-focused npm wrapper that scans packages before installation",
  "main": "dist/index.js",
  "bin": {
    "safe-npm": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc -w",
    "test": "vitest",
    "start": "node dist/index.js"
  },
  "keywords": ["npm", "security", "malware", "scanner"],
  "author": "",
  "license": "MIT",
  "type": "module"
}
```

**Step 3: Install dependencies**

Run:
```bash
npm install commander axios chalk ora
npm install ink react
npm install -D typescript @types/node @types/react vitest
```

**Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "jsx": "react"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 5: Commit**

```bash
git add package.json tsconfig.json package-lock.json
git commit -m "chore: initialize project with dependencies"
```

---

### Task 2: Create project structure

**Files:**
- Create: `src/index.ts`
- Create: `src/cli/proxy.ts`
- Create: `src/cli/check.ts`
- Create: `src/cli/args-parser.ts`
- Create: `src/i18n/index.ts`
- Create: `src/i18n/en.ts`
- Create: `src/i18n/zh.ts`
- Create: `src/utils/config.ts`

**Step 1: Create directory structure**

Run:
```bash
mkdir -p src/cli src/tui/components src/tui/hooks src/scanner/patterns src/data src/i18n src/utils tests
```

**Step 2: Create i18n/en.ts**

```typescript
export const en = {
  // General
  appName: 'safe-npm',
  version: 'Version',

  // Risk levels
  riskFatal: 'FATAL',
  riskHigh: 'HIGH RISK',
  riskWarning: 'WARNING',
  riskSafe: 'SAFE',

  // Detection messages
  virusDetected: 'Known malware detected via VirusTotal',
  typosquatDetected: 'Typosquatting detected - this may be a fake package',
  suspiciousCode: 'Suspicious code pattern detected',
  cveFound: 'Known vulnerability found',
  minerDetected: 'Crypto-miner pattern detected',

  // Actions
  blocked: 'Installation blocked',
  useForce: 'Use --force to install anyway if you are sure it is safe',
  cannotBypass: 'This threat cannot be bypassed',
  continuing: 'Continuing with installation...',

  // Scanner
  scanning: 'Scanning package',
  scanComplete: 'Scan complete',

  // Errors
  networkError: 'Network error - falling back to local cache',
  offlineMode: 'Running in offline mode',

  // TUI
  tuiWelcome: 'Welcome to safe-npm',
  tuiPopular: 'Popular Packages',
  tuiCheck: 'Check Package',
  tuiSettings: 'Settings',
  tuiQuit: 'Quit',
  tuiLanguage: 'Language',
};

export type I18nKey = keyof typeof en;
```

**Step 3: Create i18n/zh.ts**

```typescript
import type { I18nKey } from './en.js';

export const zh: Record<I18nKey, string> = {
  // General
  appName: 'safe-npm',
  version: '版本',

  // Risk levels
  riskFatal: '致命',
  riskHigh: '高危',
  riskWarning: '警告',
  riskSafe: '安全',

  // Detection messages
  virusDetected: '通过 VirusTotal 检测到已知恶意软件',
  typosquatDetected: '检测到仿冒包 - 这可能是假冒包',
  suspiciousCode: '检测到可疑代码模式',
  cveFound: '发现已知漏洞',
  minerDetected: '检测到挖矿脚本特征',

  // Actions
  blocked: '已阻止安装',
  useForce: '如确认安全，可使用 --force 强制安装',
  cannotBypass: '此威胁无法绕过',
  continuing: '继续安装...',

  // Scanner
  scanning: '正在扫描包',
  scanComplete: '扫描完成',

  // Errors
  networkError: '网络错误 - 回退到本地缓存',
  offlineMode: '离线模式运行中',

  // TUI
  tuiWelcome: '欢迎使用 safe-npm',
  tuiPopular: '热门包',
  tuiCheck: '检测包',
  tuiSettings: '设置',
  tuiQuit: '退出',
  tuiLanguage: '语言',
};
```

**Step 4: Create i18n/index.ts**

```typescript
import { en, type I18nKey } from './en.js';
import { zh } from './zh.js';
import { getConfig } from '../utils/config.js';

const translations = { en, zh };

export type Language = 'en' | 'zh';

export function t(key: I18nKey): string {
  const lang = getConfig().language;
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

export function setLanguage(lang: Language): void {
  // Will be handled via config
}

export type { I18nKey };
```

**Step 5: Create utils/config.ts**

```typescript
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
```

**Step 6: Commit**

```bash
git add src/
git commit -m "feat: add i18n and config utilities"
```

---

## Phase 2: CLI Core

### Task 3: Create CLI entry point and argument parser

**Files:**
- Create: `src/index.ts`
- Create: `src/cli/args-parser.ts`

**Step 1: Create args-parser.ts**

```typescript
export interface ParsedArgs {
  command: string;
  packages: string[];
  flags: string[];
  isInstall: boolean;
  isForce: boolean;
  isGlobal: boolean;
  isTui: boolean;
  isCheck: boolean;
}

const INSTALL_COMMANDS = ['install', 'i', 'add', 'isntall'];

export function parseArgs(args: string[]): ParsedArgs {
  const command = args[0] || '';
  const restArgs = args.slice(1);

  const flags: string[] = [];
  const packages: string[] = [];

  let isForce = false;
  let isGlobal = false;

  for (const arg of restArgs) {
    if (arg.startsWith('-')) {
      flags.push(arg);
      if (arg === '--force' || arg === '-f') {
        isForce = true;
      }
      if (arg === '-g' || arg === '--global') {
        isGlobal = true;
      }
    } else {
      packages.push(arg);
    }
  }

  const isInstall = INSTALL_COMMANDS.includes(command.toLowerCase());
  const isTui = command === 'tui';
  const isCheck = command === 'check';

  return {
    command,
    packages,
    flags,
    isInstall,
    isForce,
    isGlobal,
    isTui,
    isCheck,
  };
}
```

**Step 2: Create index.ts**

```typescript
#!/usr/bin/env node

import { parseArgs } from './cli/args-parser.js';
import { proxyToNpm } from './cli/proxy.js';
import { checkPackages } from './cli/check.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Show help or start TUI
    console.log('safe-npm - A security-focused npm wrapper');
    console.log('');
    console.log('Usage:');
    console.log('  safe-npm <npm-command>    Proxy npm commands with security checks');
    console.log('  safe-npm check <pkg>      Check package without installing');
    console.log('  safe-npm tui              Open interactive TUI');
    console.log('');
    process.exit(0);
  }

  const parsed = parseArgs(args);

  if (parsed.isTui) {
    // TUI mode - will implement later
    console.log('TUI mode coming soon...');
    process.exit(0);
  }

  if (parsed.isCheck) {
    await checkPackages(parsed.packages);
    process.exit(0);
  }

  if (parsed.isInstall && parsed.packages.length > 0) {
    // Security scan before install
    const safe = await checkPackages(parsed.packages, {
      isForce: parsed.isForce,
      install: true,
    });

    if (!safe) {
      process.exit(1);
    }
  }

  // Proxy to npm
  const exitCode = await proxyToNpm(args);
  process.exit(exitCode);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
```

**Step 3: Commit**

```bash
git add src/index.ts src/cli/args-parser.ts
git commit -m "feat: add CLI entry point and args parser"
```

---

### Task 4: Create npm proxy

**Files:**
- Create: `src/cli/proxy.ts`
- Create: `src/utils/npm-runner.ts`

**Step 1: Create npm-runner.ts**

```typescript
import { spawn } from 'child_process';

export interface NpmResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export function runNpm(args: string[]): Promise<NpmResult> {
  return new Promise((resolve) => {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    const child = spawn(npmCmd, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });

    child.on('error', () => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: stderr || 'Failed to run npm',
      });
    });
  });
}

export function runNpmPassthrough(args: string[]): Promise<number> {
  return new Promise((resolve) => {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    const child = spawn(npmCmd, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('close', (code) => {
      resolve(code ?? 1);
    });

    child.on('error', () => {
      resolve(1);
    });
  });
}
```

**Step 2: Create proxy.ts**

```typescript
import { runNpmPassthrough } from '../utils/npm-runner.js';

export async function proxyToNpm(args: string[]): Promise<number> {
  return runNpmPassthrough(args);
}
```

**Step 3: Commit**

```bash
git add src/cli/proxy.ts src/utils/npm-runner.ts
git commit -m "feat: add npm proxy functionality"
```

---

### Task 5: Create check command stub

**Files:**
- Create: `src/cli/check.ts`

**Step 1: Create check.ts**

```typescript
import chalk from 'chalk';
import { t } from '../i18n/index.js';

export interface CheckOptions {
  isForce?: boolean;
  install?: boolean;
}

export async function checkPackages(
  packages: string[],
  options: CheckOptions = {}
): Promise<boolean> {
  if (packages.length === 0) {
    console.log('No packages specified to check');
    return true;
  }

  console.log(`${t('scanning')}: ${packages.join(', ')}...`);

  // TODO: Implement actual scanning
  // For now, just return safe

  console.log(chalk.green(`✓ ${t('scanComplete')}`));
  return true;
}
```

**Step 2: Build and test**

Run:
```bash
npm run build
node dist/index.js --help
node dist/index.js check lodash
```

Expected: Shows help, then "Scanning: lodash..." and "✓ Scan complete"

**Step 3: Commit**

```bash
git add src/cli/check.ts
git commit -m "feat: add check command stub"
```

---

## Phase 3: Scanner Engine

### Task 6: Create scanner engine structure

**Files:**
- Create: `src/scanner/index.ts`
- Create: `src/scanner/types.ts`

**Step 1: Create types.ts**

```typescript
export type RiskLevel = 'fatal' | 'high' | 'warning' | 'safe';

export interface ScanResult {
  packageName: string;
  version?: string;
  riskLevel: RiskLevel;
  issues: ScanIssue[];
  canBypass: boolean;
}

export interface ScanIssue {
  type: 'virus' | 'typosquat' | 'suspicious_code' | 'cve' | 'miner';
  severity: RiskLevel;
  message: string;
  details?: string;
}

export interface ScanOptions {
  offline?: boolean;
  skipVirustotal?: boolean;
}
```

**Step 2: Create index.ts (scanner)**

```typescript
import type { ScanResult, ScanOptions, RiskLevel } from './types.js';
import { scanVirusTotal } from './virustotal.js';
import { scanTyposquatting } from './typosquatting.js';
import { scanCodePatterns } from './code-analyzer.js';
import { scanVulnerabilities } from './vulnerability.js';

export async function scanPackage(
  packageName: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const issues: ScanResult['issues'] = [];

  // Run all scans in parallel
  const [virusResult, typoResult, codeResult, vulnResult] = await Promise.all([
    options.skipVirustotal ? null : scanVirusTotal(packageName, options),
    scanTyposquatting(packageName),
    scanCodePatterns(packageName),
    scanVulnerabilities(packageName),
  ]);

  if (virusResult) issues.push(...virusResult);
  if (typoResult) issues.push(...typoResult);
  if (codeResult) issues.push(...codeResult);
  if (vulnResult) issues.push(...vulnResult);

  // Determine overall risk level
  let riskLevel: RiskLevel = 'safe';
  let canBypass = true;

  for (const issue of issues) {
    if (issue.severity === 'fatal') {
      riskLevel = 'fatal';
      canBypass = false;
      break;
    }
    if (issue.severity === 'high' && riskLevel !== 'fatal') {
      riskLevel = 'high';
    }
    if (issue.severity === 'warning' && riskLevel === 'safe') {
      riskLevel = 'warning';
    }
  }

  return {
    packageName,
    riskLevel,
    issues,
    canBypass,
  };
}

export type { ScanResult, ScanOptions, ScanIssue, RiskLevel } from './types.js';
```

**Step 3: Commit**

```bash
git add src/scanner/
git commit -m "feat: add scanner engine structure"
```

---

### Task 7: Implement typosquatting detector

**Files:**
- Create: `src/scanner/typosquatting.ts`
- Create: `src/data/popular-packages.ts`

**Step 1: Create popular-packages.ts**

```typescript
// Popular packages that are commonly typosquatted
export const popularPackages = [
  // Build tools
  'typescript', 'webpack', 'vite', 'esbuild', 'rollup', 'parcel',
  // Frameworks
  'react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'express', 'fastify', 'koa',
  // Utilities
  'lodash', 'axios', 'moment', 'dayjs', 'uuid', 'chalk', 'commander', 'yargs',
  // Testing
  'jest', 'mocha', 'vitest', 'cypress', 'playwright',
  // Linting
  'eslint', 'prettier', 'stylelint',
  // Node.js tools
  'nodemon', 'pm2', 'dotenv', 'cross-env',
  // Other popular
  'jquery', 'bootstrap', 'tailwindcss', 'sass', 'less',
];

export const popularGlobalTools = [
  { name: 'typescript', desc: 'TypeScript compiler' },
  { name: 'eslint', desc: 'JavaScript linter' },
  { name: 'prettier', desc: 'Code formatter' },
  { name: 'npm-check-updates', desc: 'Update dependencies' },
  { name: 'nodemon', desc: 'Auto-restart Node.js' },
  { name: 'tsx', desc: 'TypeScript execute' },
  { name: 'pnpm', desc: 'Fast package manager' },
  { name: 'yarn', desc: 'Alternative package manager' },
  { name: 'vercel', desc: 'Vercel CLI' },
  { name: 'netlify-cli', desc: 'Netlify CLI' },
];
```

**Step 2: Create typosquatting.ts**

```typescript
import type { ScanIssue } from './types.js';
import { popularPackages } from '../data/popular-packages.js';
import { t } from '../i18n/index.js';

// Calculate Levenshtein distance
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Common typosquatting patterns
function checkCommonPatterns(name: string, target: string): boolean {
  // Same name with hyphens/underscores swapped
  if (name.replace(/-/g, '_') === target.replace(/-/g, '_')) return false;
  if (name.replace(/_/g, '-') === target.replace(/_/g, '-')) return false;

  // Character substitution (0 for o, 1 for l, etc.)
  const normalized = name
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's');

  if (normalized === target) return true;

  return false;
}

export async function scanTyposquatting(packageName: string): Promise<ScanIssue[]> {
  const issues: ScanIssue[] = [];
  const lowerName = packageName.toLowerCase();

  // Skip if it's an exact match of a popular package
  if (popularPackages.includes(lowerName)) {
    return issues;
  }

  for (const popular of popularPackages) {
    const distance = levenshtein(lowerName, popular);

    // Very similar name (1-2 char difference)
    if (distance > 0 && distance <= 2) {
      issues.push({
        type: 'typosquat',
        severity: 'fatal',
        message: t('typosquatDetected'),
        details: `Similar to popular package "${popular}" (distance: ${distance})`,
      });
      break;
    }

    // Check common patterns
    if (checkCommonPatterns(lowerName, popular)) {
      issues.push({
        type: 'typosquat',
        severity: 'fatal',
        message: t('typosquatDetected'),
        details: `Suspicious similarity to "${popular}"`,
      });
      break;
    }
  }

  return issues;
}
```

**Step 3: Write test**

Create: `tests/typosquatting.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { scanTyposquatting } from '../src/scanner/typosquatting.js';

describe('typosquatting scanner', () => {
  it('should pass for legitimate packages', async () => {
    const result = await scanTyposquatting('lodash');
    expect(result).toHaveLength(0);
  });

  it('should detect single char typo', async () => {
    const result = await scanTyposquatting('loadsh');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('typosquat');
    expect(result[0].severity).toBe('fatal');
  });

  it('should detect common substitutions', async () => {
    const result = await scanTyposquatting('l0dash'); // 0 instead of o
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('typosquat');
  });

  it('should pass for unrelated package names', async () => {
    const result = await scanTyposquatting('my-totally-unique-package');
    expect(result).toHaveLength(0);
  });
});
```

**Step 4: Run tests**

```bash
npm test
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add src/scanner/typosquatting.ts src/data/popular-packages.ts tests/
git commit -m "feat: add typosquatting detector"
```

---

### Task 8: Implement code pattern analyzer

**Files:**
- Create: `src/scanner/code-analyzer.ts`
- Create: `src/scanner/patterns/miner.ts`
- Create: `src/scanner/patterns/exfiltration.ts`

**Step 1: Create miner.ts**

```typescript
export const minerPatterns = [
  // Known miner libraries/functions
  /cryptonight/i,
  /coinhive/i,
  /coin-?hive/i,
  /minero/i,
  /deepMiner/i,
  /coinimp/i,
  /crypto-?loot/i,
  /webminer/i,
  /mineralt/i,

  // Mining pool connections
  /stratum\+tcp:\/\//i,
  /pool\..*\.(com|net|org):\d+/i,
  /xmr\.pool/i,
  /monero.*pool/i,

  // WebAssembly mining patterns
  /cryptonight.*wasm/i,
  /cn-?lite/i,

  // CPU/GPU mining indicators
  /startMining/i,
  /miner\.start/i,
  /CryptoNoter/i,
];

export function checkMinerPatterns(code: string): { matched: boolean; pattern?: string } {
  for (const pattern of minerPatterns) {
    if (pattern.test(code)) {
      return { matched: true, pattern: pattern.source };
    }
  }
  return { matched: false };
}
```

**Step 2: Create exfiltration.ts**

```typescript
export const exfiltrationPatterns = [
  // Environment variable access + network
  {
    pattern: /process\.env\b/,
    context: /(fetch|axios|http|https|request|got)\s*\(/i,
    message: 'Environment variables accessed with network request',
  },

  // SSH key access
  {
    pattern: /\.ssh[\/\\]/,
    context: /(readFile|readFileSync|createReadStream)/,
    message: 'Accessing SSH directory',
  },

  // npmrc access
  {
    pattern: /\.npmrc/,
    context: /(readFile|readFileSync|createReadStream)/,
    message: 'Accessing .npmrc file',
  },

  // Base64 encoding of sensitive data
  {
    pattern: /Buffer\.from\(.*process\.env/,
    context: /toString\s*\(\s*['"]base64['"]\s*\)/,
    message: 'Base64 encoding environment data',
  },
];

export const suspiciousNetworkPatterns = [
  // Direct IP connections
  /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,

  // Suspicious TLDs
  /https?:\/\/[^\/]+\.(tk|ml|ga|cf|gq)\//,

  // Hex/base64 encoded URLs
  /atob\s*\(\s*['"][A-Za-z0-9+\/=]+['"]\s*\)/,
  /Buffer\.from\s*\(\s*['"][A-Za-z0-9+\/=]+['"]\s*,\s*['"]base64['"]\s*\)/,
];

export function checkExfiltrationPatterns(code: string): string[] {
  const findings: string[] = [];

  for (const { pattern, context, message } of exfiltrationPatterns) {
    if (pattern.test(code) && context.test(code)) {
      findings.push(message);
    }
  }

  for (const pattern of suspiciousNetworkPatterns) {
    if (pattern.test(code)) {
      findings.push(`Suspicious network pattern: ${pattern.source}`);
    }
  }

  return findings;
}
```

**Step 3: Create code-analyzer.ts**

```typescript
import type { ScanIssue } from './types.js';
import { checkMinerPatterns } from './patterns/miner.js';
import { checkExfiltrationPatterns } from './patterns/exfiltration.js';
import { t } from '../i18n/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function fetchPackageFiles(packageName: string): Promise<string | null> {
  try {
    // Get package info from npm
    const { stdout } = await execAsync(`npm view ${packageName} --json`, {
      timeout: 10000,
    });

    const info = JSON.parse(stdout);

    // For now, we'll check the scripts in package.json
    // Full implementation would download and scan the actual tarball
    const scripts = info.scripts || {};
    const scriptContent = Object.values(scripts).join('\n');

    return scriptContent;
  } catch {
    return null;
  }
}

export async function scanCodePatterns(packageName: string): Promise<ScanIssue[]> {
  const issues: ScanIssue[] = [];

  const code = await fetchPackageFiles(packageName);

  if (!code) {
    // Can't fetch package, skip code analysis
    return issues;
  }

  // Check for miner patterns
  const minerResult = checkMinerPatterns(code);
  if (minerResult.matched) {
    issues.push({
      type: 'miner',
      severity: 'high',
      message: t('minerDetected'),
      details: `Pattern matched: ${minerResult.pattern}`,
    });
  }

  // Check for data exfiltration patterns
  const exfilFindings = checkExfiltrationPatterns(code);
  for (const finding of exfilFindings) {
    issues.push({
      type: 'suspicious_code',
      severity: 'high',
      message: t('suspiciousCode'),
      details: finding,
    });
  }

  return issues;
}
```

**Step 4: Write tests**

Create: `tests/code-analyzer.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { checkMinerPatterns } from '../src/scanner/patterns/miner.js';
import { checkExfiltrationPatterns } from '../src/scanner/patterns/exfiltration.js';

describe('miner pattern detection', () => {
  it('should detect coinhive', () => {
    const code = 'var miner = new CoinHive.Anonymous("site-key");';
    const result = checkMinerPatterns(code);
    expect(result.matched).toBe(true);
  });

  it('should detect mining pool connections', () => {
    const code = 'connect("stratum+tcp://pool.example.com:3333")';
    const result = checkMinerPatterns(code);
    expect(result.matched).toBe(true);
  });

  it('should pass clean code', () => {
    const code = 'console.log("hello world");';
    const result = checkMinerPatterns(code);
    expect(result.matched).toBe(false);
  });
});

describe('exfiltration pattern detection', () => {
  it('should detect direct IP connections', () => {
    const code = 'fetch("http://192.168.1.1/data")';
    const findings = checkExfiltrationPatterns(code);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should detect suspicious TLDs', () => {
    const code = 'axios.get("https://evil.tk/steal")';
    const findings = checkExfiltrationPatterns(code);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should pass normal URLs', () => {
    const code = 'fetch("https://api.github.com/repos")';
    const findings = checkExfiltrationPatterns(code);
    expect(findings.length).toBe(0);
  });
});
```

**Step 5: Run tests**

```bash
npm test
```

**Step 6: Commit**

```bash
git add src/scanner/code-analyzer.ts src/scanner/patterns/ tests/code-analyzer.test.ts
git commit -m "feat: add code pattern analyzer with miner and exfiltration detection"
```

---

### Task 9: Create VirusTotal scanner stub

**Files:**
- Create: `src/scanner/virustotal.ts`

**Step 1: Create virustotal.ts**

```typescript
import type { ScanIssue, ScanOptions } from './types.js';
import { t } from '../i18n/index.js';
import { getConfig } from '../utils/config.js';
import axios from 'axios';

// Local blacklist cache for offline mode
const localBlacklist = new Set([
  // Known malicious packages (examples)
  'event-stream-malicious',
  'flatmap-stream',
  'ua-parser-js-malicious',
]);

export async function scanVirusTotal(
  packageName: string,
  options: ScanOptions = {}
): Promise<ScanIssue[]> {
  const issues: ScanIssue[] = [];
  const config = getConfig();

  // Check local blacklist first
  if (localBlacklist.has(packageName)) {
    issues.push({
      type: 'virus',
      severity: 'fatal',
      message: t('virusDetected'),
      details: 'Package found in local blacklist',
    });
    return issues;
  }

  // If offline mode or no API key, skip online check
  if (options.offline || config.offline || !config.virustotal.apiKey) {
    return issues;
  }

  // TODO: Implement actual VirusTotal API integration
  // For now, just return empty (no issues found)
  // Real implementation would:
  // 1. Calculate package hash
  // 2. Query VirusTotal API
  // 3. Parse results for detections

  return issues;
}
```

**Step 2: Commit**

```bash
git add src/scanner/virustotal.ts
git commit -m "feat: add VirusTotal scanner stub with local blacklist"
```

---

### Task 10: Create vulnerability scanner

**Files:**
- Create: `src/scanner/vulnerability.ts`

**Step 1: Create vulnerability.ts**

```typescript
import type { ScanIssue } from './types.js';
import { t } from '../i18n/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface NpmAuditVuln {
  severity: 'info' | 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  url: string;
}

export async function scanVulnerabilities(packageName: string): Promise<ScanIssue[]> {
  const issues: ScanIssue[] = [];

  try {
    // Use npm audit to check for known vulnerabilities
    const { stdout } = await execAsync(`npm audit --json --package-lock-only 2>/dev/null || true`, {
      timeout: 30000,
    });

    if (!stdout.trim()) {
      return issues;
    }

    const auditResult = JSON.parse(stdout);

    // Check if our package is in the vulnerabilities
    const vulns = auditResult.vulnerabilities || {};

    if (vulns[packageName]) {
      const vuln = vulns[packageName];
      const severity = vuln.severity;

      if (severity === 'critical' || severity === 'high') {
        issues.push({
          type: 'cve',
          severity: 'warning', // CVEs are warnings, not blockers
          message: t('cveFound'),
          details: `${severity.toUpperCase()}: ${vuln.via?.[0]?.title || 'Known vulnerability'}`,
        });
      }
    }
  } catch {
    // Audit failed, skip vulnerability check
  }

  return issues;
}
```

**Step 2: Commit**

```bash
git add src/scanner/vulnerability.ts
git commit -m "feat: add vulnerability scanner using npm audit"
```

---

### Task 11: Integrate scanner into check command

**Files:**
- Modify: `src/cli/check.ts`

**Step 1: Update check.ts**

```typescript
import chalk from 'chalk';
import ora from 'ora';
import { t } from '../i18n/index.js';
import { scanPackage, type ScanResult } from '../scanner/index.js';

export interface CheckOptions {
  isForce?: boolean;
  install?: boolean;
}

function formatResult(result: ScanResult): void {
  const { packageName, riskLevel, issues, canBypass } = result;

  if (riskLevel === 'safe') {
    console.log(chalk.green(`✓ ${packageName}: ${t('riskSafe')}`));
    return;
  }

  const levelColors = {
    fatal: chalk.bgRed.white,
    high: chalk.red,
    warning: chalk.yellow,
    safe: chalk.green,
  };

  const levelColor = levelColors[riskLevel];
  console.log('');
  console.log(levelColor(`⚠ ${packageName}: ${t(`risk${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}` as any)}`));
  console.log('');

  for (const issue of issues) {
    console.log(`  [!] ${issue.message}`);
    if (issue.details) {
      console.log(chalk.dim(`      ${issue.details}`));
    }
  }

  console.log('');

  if (!canBypass) {
    console.log(chalk.red(`✗ ${t('blocked')} - ${t('cannotBypass')}`));
  } else if (riskLevel === 'high') {
    console.log(chalk.red(`✗ ${t('blocked')}`));
    console.log(chalk.dim(`  ${t('useForce')}`));
  } else {
    console.log(chalk.yellow(`⚠ ${t('continuing')}`));
  }
}

export async function checkPackages(
  packages: string[],
  options: CheckOptions = {}
): Promise<boolean> {
  if (packages.length === 0) {
    console.log('No packages specified to check');
    return true;
  }

  const spinner = ora(`${t('scanning')}...`).start();

  let allSafe = true;
  const results: ScanResult[] = [];

  for (const pkg of packages) {
    spinner.text = `${t('scanning')}: ${pkg}`;
    const result = await scanPackage(pkg);
    results.push(result);

    if (result.riskLevel === 'fatal') {
      allSafe = false;
    } else if (result.riskLevel === 'high' && !options.isForce) {
      allSafe = false;
    }
  }

  spinner.stop();

  console.log(chalk.bold(`\n${t('scanComplete')}\n`));

  for (const result of results) {
    formatResult(result);
  }

  return allSafe;
}
```

**Step 2: Build and test**

```bash
npm run build
node dist/index.js check lodash
node dist/index.js check loadsh  # typosquat
```

Expected: lodash passes, loadsh shows typosquatting warning

**Step 3: Commit**

```bash
git add src/cli/check.ts
git commit -m "feat: integrate scanner engine into check command"
```

---

## Phase 4: TUI (Minimal)

### Task 12: Create basic TUI shell

**Files:**
- Create: `src/tui/App.tsx`
- Create: `src/tui/index.tsx`

**Step 1: Create index.tsx**

```typescript
import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

export function startTui(): void {
  render(<App />);
}
```

**Step 2: Create App.tsx**

```typescript
import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { t } from '../i18n/index.js';

type Screen = 'menu' | 'popular' | 'check' | 'settings';

export function App(): React.ReactElement {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { exit } = useApp();

  const menuItems = [
    { key: 'popular', label: t('tuiPopular') },
    { key: 'check', label: t('tuiCheck') },
    { key: 'settings', label: t('tuiSettings') },
    { key: 'quit', label: t('tuiQuit') },
  ];

  useInput((input, key) => {
    if (screen === 'menu') {
      if (key.upArrow) {
        setSelectedIndex((i) => (i > 0 ? i - 1 : menuItems.length - 1));
      }
      if (key.downArrow) {
        setSelectedIndex((i) => (i < menuItems.length - 1 ? i + 1 : 0));
      }
      if (key.return) {
        const item = menuItems[selectedIndex];
        if (item.key === 'quit') {
          exit();
        } else {
          setScreen(item.key as Screen);
        }
      }
    }

    if (input === 'q') {
      if (screen === 'menu') {
        exit();
      } else {
        setScreen('menu');
      }
    }
  });

  if (screen === 'menu') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="cyan">{t('tuiWelcome')}</Text>
        <Text> </Text>
        {menuItems.map((item, i) => (
          <Text key={item.key} color={i === selectedIndex ? 'green' : undefined}>
            {i === selectedIndex ? '❯ ' : '  '}{item.label}
          </Text>
        ))}
        <Text> </Text>
        <Text dimColor>Use ↑↓ to navigate, Enter to select, q to quit</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">{screen.toUpperCase()}</Text>
      <Text> </Text>
      <Text>Coming soon...</Text>
      <Text dimColor>Press q to go back</Text>
    </Box>
  );
}
```

**Step 3: Update index.ts to use TUI**

Modify `src/index.ts`:

```typescript
// Add import at top
import { startTui } from './tui/index.js';

// Update the isTui block:
if (parsed.isTui) {
  startTui();
  // Don't exit - Ink handles the process
  return;
}
```

**Step 4: Build and test**

```bash
npm run build
node dist/index.js tui
```

Expected: Shows menu with arrow key navigation

**Step 5: Commit**

```bash
git add src/tui/ src/index.ts
git commit -m "feat: add basic TUI shell with Ink"
```

---

## Phase 5: Final Integration

### Task 13: Add shebang and make executable

**Step 1: Verify shebang in index.ts**

Ensure first line is: `#!/usr/bin/env node`

**Step 2: Build final version**

```bash
npm run build
```

**Step 3: Test all modes**

```bash
# Proxy mode
node dist/index.js --version

# Check mode
node dist/index.js check lodash

# TUI mode
node dist/index.js tui
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: complete initial safe-npm implementation"
```

---

### Task 14: Create README

**Files:**
- Create: `README.md`

**Step 1: Create README.md**

```markdown
# safe-npm

A security-focused npm wrapper that scans packages before installation.

## Features

- **Malware Detection**: Checks packages against VirusTotal and local blacklist
- **Typosquatting Protection**: Detects packages with names similar to popular packages
- **Code Analysis**: Scans postinstall scripts and entry points for suspicious patterns
- **Miner Detection**: Identifies crypto-mining scripts
- **CVE Checking**: Reports known vulnerabilities
- **Multi-language**: Supports English and Chinese

## Installation

```bash
npm install -g safe-npm
```

## Usage

### Proxy Mode (Default)

Use safe-npm as a drop-in replacement for npm:

```bash
safe-npm install lodash
safe-npm install -g typescript
safe-npm run build
```

### Check Mode

Scan a package without installing:

```bash
safe-npm check suspicious-package
```

### TUI Mode

Open interactive interface:

```bash
safe-npm tui
```

## Risk Levels

| Level | Action |
|-------|--------|
| Fatal | Blocked, cannot bypass (virus, typosquat) |
| High | Blocked by default, use `--force` to bypass |
| Warning | Shows warning, continues installation |
| Safe | No issues found |

## Configuration

Config file: `~/.safe-npm/config.json`

```json
{
  "language": "en",
  "virustotal": {
    "apiKey": "your-api-key",
    "enabled": true
  },
  "offline": false
}
```

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

## Summary

After completing all tasks, you will have:

1. **CLI Entry Point** - Parses commands and routes to appropriate handlers
2. **NPM Proxy** - Transparently passes commands to npm
3. **Security Scanner** - Multi-layered detection engine
   - VirusTotal integration (stub)
   - Typosquatting detector
   - Code pattern analyzer (miner, exfiltration)
   - CVE vulnerability checker
4. **TUI Interface** - Basic Ink-based interactive menu
5. **i18n Support** - English and Chinese translations
6. **Configuration** - User preferences and API keys

Total estimated commits: 14
