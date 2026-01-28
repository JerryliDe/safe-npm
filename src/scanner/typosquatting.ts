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

function parsePackageName(name: string) {
  if (name.startsWith('@')) {
    const parts = name.split('/');
    return { scope: parts[0], name: parts[1] || '' };
  }
  return { scope: null, name: name };
}

export function findClosestPopularPackage(packageName: string): string | null {
  const lowerName = packageName.toLowerCase();
  const targetParsed = parsePackageName(lowerName);

  let bestMatch: string | null = null;
  let minDistance = Infinity;

  for (const popular of popularPackages) {
    const distance = levenshtein(lowerName, popular);

    // Exact match is not a suggestion
    if (distance === 0) return null;

    if (distance <= 3 && distance < minDistance) { // Slightly looser threshold for "Did you mean?"
      minDistance = distance;
      bestMatch = popular;
    }

    // Check scoped similarity for suggestions
    const popularParsed = parsePackageName(popular);
    if (popularParsed.scope && targetParsed.name) {
         const baseDist = levenshtein(targetParsed.name, popularParsed.name);
         if (baseDist <= 1) {
             return popular; // Strong signal: base name matches scoped package
         }
    }
  }

  return bestMatch;
}

export async function scanTyposquatting(packageName: string): Promise<ScanIssue[]> {
  const issues: ScanIssue[] = [];
  const lowerName = packageName.toLowerCase();

  // Skip if it's an exact match of a popular package
  if (popularPackages.includes(lowerName)) {
    return issues;
  }

  const targetParsed = parsePackageName(lowerName);

  for (const popular of popularPackages) {
    // 1. Standard full-name check
    const distance = levenshtein(lowerName, popular);

    if (distance > 0 && distance <= 2) {
      issues.push({
        type: 'typosquat',
        severity: 'fatal',
        message: t('typosquatDetected'),
        details: `Similar to popular package "${popular}" (distance: ${distance})`,
      });
      break;
    }

    if (checkCommonPatterns(lowerName, popular)) {
      issues.push({
        type: 'typosquat',
        severity: 'fatal',
        message: t('typosquatDetected'),
        details: `Suspicious similarity to "${popular}"`,
      });
      break;
    }

    // 2. Scoped package protection logic
    const popularParsed = parsePackageName(popular);
    if (popularParsed.scope) {
        // If the popular package IS scoped (e.g., @anthropic-ai/claude-code)

        // Check A: The user is trying to install the "unscoped" version (e.g. claude-code)
        // or a version in a different scope (e.g. @fake/claude-code)
        const baseNameDistance = levenshtein(targetParsed.name, popularParsed.name);

        // If the base name is identical or extremely similar
        if (baseNameDistance <= 1) { // Very strict for scoped bases
            // And the scopes are different (or target has no scope)
            if (targetParsed.scope !== popularParsed.scope) {
                issues.push({
                    type: 'typosquat',
                    severity: 'fatal',
                    message: t('typosquatDetected'),
                    details: `Scope Hijacking Detected: This package "${packageName}" mimics the official package "${popular}". Verify the scope carefully!`,
                });
                break;
            }
        }
    }
  }

  return issues;
}
