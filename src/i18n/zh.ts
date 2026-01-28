import type { I18nKey } from './en.js';

export const zh: Record<I18nKey, string> = {
  // General
  appName: 'safe-npm',
  version: '版本',

  // Risk levels
  riskFatal: '致命',
  riskHigh: '高危',
  riskWarning: '警告',
  riskSafe: '安全',

  // Detection messages
  virusDetected: '通过 VirusTotal 检测到已知恶意软件',
  typosquatDetected: '检测到仿冒包 - 这可能是假冒包',
  suspiciousCode: '检测到可疑代码模式',
  cveFound: '发现已知漏洞',
  minerDetected: '检测到挖矿脚本特征',

  // Actions
  blocked: '已阻止安装',
  useForce: '如确认安全，可使用 --force 强制安装',
  cannotBypass: '此威胁无法绕过',
  continuing: '继续安装...',

  // Scanner
  scanning: '正在扫描包',
  scanComplete: '扫描完成',

  // Errors
  networkError: '网络错误 - 回退到本地缓存',
  offlineMode: '离线模式运行中',

  // TUI
  tuiWelcome: '欢迎使用 safe-npm',
  tuiPopular: '热门包',
  tuiCheck: '检测包',
  tuiSettings: '设置',
  tuiQuit: '退出',
  tuiLanguage: '语言',
};
