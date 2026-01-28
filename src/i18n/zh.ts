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
  virusDetected: '检测到已知恶意软件',
  typosquatDetected: '检测到仿冒包 - 这可能是假冒包',
  suspiciousCode: '检测到可疑代码模式',
  cveFound: '发现已知漏洞',
  minerDetected: '检测到挖矿脚本特征',
  obfuscatedCode: '检测到代码混淆 - 可能隐藏恶意行为',
  dangerousScript: '检测到危险的安装脚本',
  blacklisted: '此包在已知恶意包名单中',

  // Actions
  blocked: '已阻止安装',
  useForce: '如确认安全，可使用 --force 强制安装',
  cannotBypass: '此威胁无法绕过',
  continuing: '继续安装...',

  // Scanner
  scanning: '正在扫描包',
  scanComplete: '扫描完成',
  downloadingPackage: '正在下载包进行分析',
  analyzingCode: '正在分析代码模式',
  checkingVirustotal: '正在检查 VirusTotal 数据库',
  checkingBlacklist: '正在检查已知恶意包名单',

  // Errors
  networkError: '网络错误 - 回退到本地缓存',
  offlineMode: '离线模式运行中',
  vtNoApiKey: '未配置 VirusTotal API 密钥 - 跳过在线扫描',

  // TUI
  tuiWelcome: '欢迎使用 safe-npm',
  tuiPopular: '热门包',
  tuiCheck: '检测包',
  tuiSettings: '设置',
  tuiQuit: '退出',
  tuiLanguage: '语言',

  // Suggestions
  suggestionTitle: '💡 建议：您是否想安装官方正版包',
  suggestionPrompt: '您是否要安装',
  installingCorrect: '🚀 正在安装正确的包',
  packageNotFound: '在注册表中未找到此包',
  didYouMean: '您是指',
  checkName: '请检查包名',
  registryCheckFail: '包不存在',
};
