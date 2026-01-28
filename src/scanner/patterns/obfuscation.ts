/**
 * Patterns for detecting code obfuscation
 * Obfuscated code is often used to hide malicious behavior
 */

export const obfuscationPatterns = [
  // Hex encoded strings (common in obfuscated code)
  {
    pattern: /\\x[0-9a-f]{2}(?:\\x[0-9a-f]{2}){10,}/i,
    name: 'Hex-encoded string sequence',
  },

  // Unicode escape sequences (excessive use)
  {
    pattern: /\\u[0-9a-f]{4}(?:\\u[0-9a-f]{4}){10,}/i,
    name: 'Unicode escape sequence',
  },

  // Base64 with eval
  {
    pattern: /eval\s*\(\s*(?:atob|Buffer\.from)\s*\(/i,
    name: 'eval() with Base64 decode',
  },

  // Long strings without spaces (typical of encoded payloads)
  {
    pattern: /['"][A-Za-z0-9+\/=]{200,}['"]/,
    name: 'Long Base64-like string',
  },

  // Function constructor with string (code execution)
  {
    pattern: /new\s+Function\s*\(\s*['"].*['"]\s*\)/,
    name: 'new Function() with string code',
  },

  // Common obfuscator patterns
  {
    pattern: /_0x[a-f0-9]{4,}/i,
    name: 'JavaScript obfuscator variable pattern',
  },

  // Array-based string obfuscation
  {
    pattern: /\[['"][^'"]{1,20}['"](?:\s*,\s*['"][^'"]{1,20}['"]\s*){20,}\]/,
    name: 'Array-based string obfuscation',
  },

  // Bitwise operations for string decoding
  {
    pattern: /String\.fromCharCode\s*\(\s*(?:\d+\s*[\^&|]\s*)+\d+\s*\)/,
    name: 'Bitwise string decoding',
  },

  // JSFuck patterns
  {
    pattern: /\[\]\[(!\[\]\+\[\])/,
    name: 'JSFuck obfuscation',
  },

  // eval with string concatenation/manipulation
  {
    pattern: /eval\s*\(\s*(?:\w+\s*\+\s*)+\w+\s*\)/,
    name: 'eval() with string concatenation',
  },

  // setTimeout/setInterval with string
  {
    pattern: /set(?:Timeout|Interval)\s*\(\s*['"][^'"]+['"]/,
    name: 'setTimeout/setInterval with string code',
  },

  // Char code array to string
  {
    pattern: /String\.fromCharCode\.apply\s*\(\s*null\s*,/,
    name: 'Char code array conversion',
  },
];

// Threshold for considering code as obfuscated
const OBFUSCATION_THRESHOLD = 0.3; // 30% of lines look obfuscated

/**
 * Analyze code for obfuscation patterns
 */
export function checkObfuscationPatterns(code: string): { matched: boolean; pattern?: string } {
  // Check for specific obfuscation patterns
  for (const { pattern, name } of obfuscationPatterns) {
    if (pattern.test(code)) {
      return { matched: true, pattern: name };
    }
  }

  // Heuristic: check for high entropy (many short variable names)
  const lines = code.split('\n').filter(line => line.trim().length > 0);

  if (lines.length < 10) {
    return { matched: false };
  }

  // Count lines with suspicious patterns
  let suspiciousLines = 0;

  for (const line of lines) {
    // Very long line without spaces
    if (line.length > 500 && line.split(/\s+/).length < 10) {
      suspiciousLines++;
      continue;
    }

    // Many short variable names (a, b, c, _0x...)
    const shortVarMatches = line.match(/\b[a-z_$][a-z0-9_$]?\b/gi);
    if (shortVarMatches && shortVarMatches.length > 20) {
      suspiciousLines++;
      continue;
    }

    // Excessive bracket/parenthesis nesting
    const brackets = (line.match(/[\[\]\(\)\{\}]/g) || []).length;
    if (brackets > 50) {
      suspiciousLines++;
      continue;
    }
  }

  const obfuscationRatio = suspiciousLines / lines.length;

  if (obfuscationRatio > OBFUSCATION_THRESHOLD) {
    return { matched: true, pattern: `Heuristic: ${Math.round(obfuscationRatio * 100)}% of code appears obfuscated` };
  }

  return { matched: false };
}
