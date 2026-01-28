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
