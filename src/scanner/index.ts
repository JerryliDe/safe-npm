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
    canBypass,
  };
}

export type { ScanResult, ScanOptions, ScanIssue, RiskLevel } from './types.js';
