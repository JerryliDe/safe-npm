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
