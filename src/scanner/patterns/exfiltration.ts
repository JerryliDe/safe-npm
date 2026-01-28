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
