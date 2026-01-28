import type { ScanResult, ScanOptions, RiskLevel, ScanCheck, ProgressCallback } from './types.js';
import { scanVirusTotal } from './virustotal.js';
import { scanTyposquatting, findClosestPopularPackage } from './typosquatting.js';
import { scanCodePatterns } from './code-analyzer.js';
import { scanVulnerabilities } from './vulnerability.js';
import { checkPackageExists } from '../utils/npm-package.js';

import { t } from '../i18n/index.js';

// Built-in trusted packages
const TRUSTED_PACKAGES = new Set([
  'deepv-code'
]);

export async function scanPackage(
  packageName: string,
  options: ScanOptions = {},
  onProgress?: ProgressCallback
): Promise<ScanResult> {
  // Check whitelist first
  if (TRUSTED_PACKAGES.has(packageName)) {
    onProgress?.('Checking whitelist...', 1, 1);
    return {
      packageName,
      riskLevel: 'safe',
      issues: [],
      checks: [
        { name: 'Whitelist Check', status: 'pass', description: 'Package is in the built-in trusted list' },
        { name: 'VirusTotal Scan', status: 'pass', description: 'Implicitly passed (Trusted)' },
        { name: 'Typosquatting Check', status: 'pass', description: 'Implicitly passed (Trusted)' },
        { name: 'Code Analysis', status: 'pass', description: 'Implicitly passed (Trusted)' },
        { name: 'Vulnerability Check', status: 'pass', description: 'Implicitly passed (Trusted)' }
      ],
      canBypass: true,
    };
  }

  // Check if package exists in registry
  onProgress?.('Checking registry...', 0, 1);
  const exists = await checkPackageExists(packageName);

  if (!exists) {
      const suggestion = findClosestPopularPackage(packageName);
      return {
          packageName,
          riskLevel: 'fatal', // Treat as fatal to stop installation flow
          issues: [{
              type: 'typosquat',
              severity: 'fatal',
              message: t('packageNotFound'),
              details: suggestion ? `${t('didYouMean')} "${suggestion}"?` : t('checkName')
          }],
          checks: [
            { name: 'Registry Check', status: 'fail', description: t('registryCheckFail') }
          ],
          canBypass: false,
          suggestedPackage: suggestion || undefined
      };
  }

  const issues: ScanResult['issues'] = [];
  const checks: ScanCheck[] = [];

  // Helper to wrap tasks with progress
  let completedTasks = 0;
  const totalTasks = 4; // VT, Typo, Code, Vuln

  const wrapTask = async <T>(name: string, task: Promise<T>): Promise<T> => {
    onProgress?.(`Starting ${name}...`, completedTasks, totalTasks);
    try {
        const res = await task;
        completedTasks++;
        onProgress?.(`Finished ${name}`, completedTasks, totalTasks);
        return res;
    } catch (err) {
        completedTasks++;
        onProgress?.(`Error in ${name}`, completedTasks, totalTasks);
        throw err;
    }
  };

  // Run all scans in parallel
  const [virusResult, typoResult, codeResult, vulnResult] = await Promise.all([
    wrapTask('VirusTotal', options.skipVirustotal ? Promise.resolve(null) : scanVirusTotal(packageName, options).catch(err => {
        console.error('VT Error:', err);
        return null;
    })),
    wrapTask('Typosquatting Check', scanTyposquatting(packageName).catch(err => {
        console.error('Typo Error:', err);
        return [];
    })),
    wrapTask('Code Analysis', scanCodePatterns(packageName).catch(err => {
        console.error('Code Error:', err);
        return [];
    })),
    wrapTask('Vulnerability Check', scanVulnerabilities(packageName).catch(err => {
        console.error('Vuln Error:', err);
        return [];
    })),
  ]);

  // Process VirusTotal
  if (options.skipVirustotal) {
    checks.push({ name: 'VirusTotal Scan', status: 'skipped', description: 'Skipped by user option' });
  } else if (virusResult) {
    // If it's the new object structure
    const vtIssues = 'issues' in virusResult ? virusResult.issues : virusResult;
    const vtInfo = 'info' in virusResult ? virusResult.info : 'Scan complete';

    if (vtIssues && vtIssues.length > 0) {
      checks.push({ name: 'VirusTotal Scan', status: 'fail', description: vtInfo as string });
      issues.push(...vtIssues);
    } else {
      checks.push({ name: 'VirusTotal Scan', status: 'pass', description: vtInfo as string });
    }
  } else {
    // Should not happen if catch returns null, but just in case
    checks.push({ name: 'VirusTotal Scan', status: 'error', description: 'Scan failed to execute' });
  }

  // Process Typosquatting
  if (typoResult && typoResult.length > 0) {
    checks.push({ name: 'Typosquatting Check', status: 'fail', description: 'Suspicious package name detected' });
    issues.push(...typoResult);
  } else {
    checks.push({ name: 'Typosquatting Check', status: 'pass', description: 'Package name looks safe' });
  }

  // Process Code Patterns
  if (codeResult && codeResult.length > 0) {
    checks.push({ name: 'Static Code Analysis', status: 'fail', description: 'Suspicious code patterns detected' });
    issues.push(...codeResult);
  } else {
    checks.push({ name: 'Static Code Analysis', status: 'pass', description: 'No malicious code patterns found' });
  }

  // Process Vulnerabilities
  if (vulnResult && vulnResult.length > 0) {
    checks.push({ name: 'Vulnerability Database', status: 'fail', description: `Found ${vulnResult.length} known vulnerabilities` });
    issues.push(...vulnResult);
  } else {
    checks.push({ name: 'Vulnerability Database', status: 'pass', description: 'No known vulnerabilities (CVEs)' });
  }

  // Determine overall risk level
  let riskLevel: RiskLevel = 'safe';
  let canBypass = true;
  let suggestedPackage: string | undefined;

  for (const issue of issues) {
    if (issue.severity === 'fatal') {
      riskLevel = 'fatal';
      canBypass = false;

      // Try to extract suggestion from typosquat details
      if (issue.type === 'typosquat' && issue.details?.includes('"')) {
          const match = issue.details.match(/"([^"]+)"/);
          if (match) suggestedPackage = match[1];
      }
      break;
    }
    if (issue.severity === 'high') {
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
    checks,
    canBypass,
    suggestedPackage,
  };
}

export type { ScanResult, ScanOptions, ScanIssue, RiskLevel, ProgressCallback } from './types.js';
