import type { ScanIssue } from './types.js';
import { checkMinerPatterns } from './patterns/miner.js';
import { checkExfiltrationPatterns } from './patterns/exfiltration.js';
import { checkObfuscationPatterns } from './patterns/obfuscation.js';
import { t } from '../i18n/index.js';
import { extractAndScanPackage, getPackageInfo, type PackageFiles } from '../utils/npm-package.js';

// Dangerous postinstall script patterns
const dangerousScriptPatterns = [
  // Direct command execution
  /curl\s+.*\|\s*(bash|sh)/i,
  /wget\s+.*\|\s*(bash|sh)/i,
  /powershell\s+-.*downloadstring/i,
  /powershell\s+.*iex/i,

  // Reverse shells
  /bash\s+-i\s+>&\s*\/dev\/tcp/i,
  /nc\s+-e\s+\/bin\/(ba)?sh/i,
  /python.*socket.*connect/i,

  // Suspicious node execution
  /node\s+-e\s+['"].*require.*child_process/i,
  /node\s+-e\s+['"].*eval\s*\(/i,

  // Environment variable exfiltration
  /curl.*\$\{?npm_config/i,
  /curl.*process\.env/i,
];

/**
 * Scan package.json scripts for dangerous patterns
 */
function scanScripts(scripts: Record<string, string>): ScanIssue[] {
  const issues: ScanIssue[] = [];

  const dangerousScriptNames = ['preinstall', 'install', 'postinstall', 'preuninstall', 'postuninstall'];

  for (const [name, script] of Object.entries(scripts)) {
    // Check if it's a lifecycle script
    const isLifecycleScript = dangerousScriptNames.includes(name);

    for (const pattern of dangerousScriptPatterns) {
      if (pattern.test(script)) {
        issues.push({
          type: 'suspicious_code',
          severity: isLifecycleScript ? 'high' : 'warning',
          message: t('suspiciousCode'),
          details: `Dangerous pattern in "${name}" script: ${pattern.source}`,
        });
        break;
      }
    }

    // Check for obfuscated commands in scripts
    if (isLifecycleScript && script.length > 500) {
      // Very long script might be hiding something
      issues.push({
        type: 'suspicious_code',
        severity: 'warning',
        message: t('suspiciousCode'),
        details: `Unusually long "${name}" script (${script.length} chars) - manual review recommended`,
      });
    }
  }

  return issues;
}

/**
 * Scan JavaScript file content for malicious patterns
 */
function scanFileContent(filePath: string, content: string): ScanIssue[] {
  const issues: ScanIssue[] = [];

  // Check for miner patterns
  const minerResult = checkMinerPatterns(content);
  if (minerResult.matched) {
    issues.push({
      type: 'miner',
      severity: 'high',
      message: t('minerDetected'),
      details: `Pattern matched in ${filePath}: ${minerResult.pattern}`,
    });
  }

  // Check for data exfiltration patterns
  const exfilFindings = checkExfiltrationPatterns(content);
  for (const finding of exfilFindings) {
    issues.push({
      type: 'suspicious_code',
      severity: 'high',
      message: t('suspiciousCode'),
      details: `${finding} (in ${filePath})`,
    });
  }

  // Check for obfuscation patterns
  const obfuscationResult = checkObfuscationPatterns(content);
  if (obfuscationResult.matched) {
    issues.push({
      type: 'suspicious_code',
      severity: 'warning',
      message: t('suspiciousCode'),
      details: `Code obfuscation detected in ${filePath}: ${obfuscationResult.pattern}`,
    });
  }

  return issues;
}

export async function scanCodePatterns(packageName: string): Promise<ScanIssue[]> {
  const issues: ScanIssue[] = [];

  // First, try to get basic package info without downloading
  const packageInfo = await getPackageInfo(packageName);

  if (!packageInfo) {
    // Can't fetch package info, skip code analysis
    return issues;
  }

  // Quick check on package.json scripts first
  if (Object.keys(packageInfo.scripts).length > 0) {
    const scriptIssues = scanScripts(packageInfo.scripts);
    issues.push(...scriptIssues);
  }

  // Check if package has lifecycle scripts that warrant deeper analysis
  const hasLifecycleScripts = ['preinstall', 'install', 'postinstall'].some(
    s => s in packageInfo.scripts
  );

  // If there are lifecycle scripts or already found issues, do deep scan
  if (hasLifecycleScripts || issues.length > 0) {
    const packageFiles = await extractAndScanPackage(packageName);

    if (packageFiles) {
      // Scan all collected JS files
      for (const file of packageFiles.allJsFiles) {
        const fileIssues = scanFileContent(file.path, file.content);
        issues.push(...fileIssues);
      }

      // Scan entry file if not already scanned
      if (packageFiles.entryContent) {
        const entryPath = packageFiles.entryFile || 'index.js';
        const alreadyScanned = packageFiles.allJsFiles.some(f => f.path === entryPath);

        if (!alreadyScanned) {
          const entryIssues = scanFileContent(entryPath, packageFiles.entryContent);
          issues.push(...entryIssues);
        }
      }
    }
  }

  return issues;
}
