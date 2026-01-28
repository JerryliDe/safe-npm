export type RiskLevel = 'fatal' | 'high' | 'warning' | 'safe';

export interface ScanResult {
  packageName: string;
  version?: string;
  riskLevel: RiskLevel;
  issues: ScanIssue[];
  canBypass: boolean;
}

export interface ScanIssue {
  type: 'virus' | 'typosquat' | 'suspicious_code' | 'cve' | 'miner';
  severity: RiskLevel;
  message: string;
  details?: string;
}

export interface ScanOptions {
  offline?: boolean;
  skipVirustotal?: boolean;
}
