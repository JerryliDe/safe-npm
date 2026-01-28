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
  virusDetected: 'Known malware detected',
  typosquatDetected: 'Typosquatting detected - this may be a fake package',
  suspiciousCode: 'Suspicious code pattern detected',
  cveFound: 'Known vulnerability found',
  minerDetected: 'Crypto-miner pattern detected',
  obfuscatedCode: 'Obfuscated code detected - may hide malicious behavior',
  dangerousScript: 'Dangerous install script detected',
  blacklisted: 'Package is in known malicious packages list',

  // Actions
  blocked: 'Installation blocked',
  useForce: 'Use --force to install anyway if you are sure it is safe',
  cannotBypass: 'This threat cannot be bypassed',
  continuing: 'Continuing with installation...',

  // Scanner
  scanning: 'Scanning package',
  scanComplete: 'Scan complete',
  downloadingPackage: 'Downloading package for analysis',
  analyzingCode: 'Analyzing code patterns',
  checkingVirustotal: 'Checking VirusTotal database',
  checkingBlacklist: 'Checking against known malicious packages',

  // Errors
  networkError: 'Network error - falling back to local cache',
  offlineMode: 'Running in offline mode',
  vtNoApiKey: 'VirusTotal API key not configured - skipping online scan',

  // TUI
  tuiWelcome: 'Welcome to safe-npm',
  tuiPopular: 'Popular Packages',
  tuiCheck: 'Check Package',
  tuiSettings: 'Settings',
  tuiQuit: 'Quit',
  tuiLanguage: 'Language',

  // Suggestions
  suggestionTitle: '💡 Suggestion: Did you mean to install the official package',
  suggestionPrompt: 'Do you want to install',
  installingCorrect: '🚀 Installing correct package',
  packageNotFound: 'Package not found in registry',
  didYouMean: 'Did you mean',
  checkName: 'Please check the package name',
  registryCheckFail: 'Package does not exist',
};

export type I18nKey = keyof typeof en;
