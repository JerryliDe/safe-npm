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
