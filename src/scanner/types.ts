export type RiskLevel = 'fatal' | 'high' | 'warning' | 'safe';

export interface ScanResult {
  packageName: string;
  version?: string;
  riskLevel: RiskLevel;
  issues: ScanIssue[];
  checks: ScanCheck[];
  canBypass: boolean;
  suggestedPackage?: string;
}

export interface ScanCheck {
  name: string;
  status: 'pass' | 'fail' | 'skipped' | 'error';
  description?: string;
}

export interface ScanIssue {
  type: 'virus' | 'typosquat' | 'suspicious_code' | 'cve' | 'miner';
  severity: RiskLevel;
  message: string;
  details?: string;
  suggestion?: string;
}

export interface ScanOptions {
  offline?: boolean;
  skipVirustotal?: boolean;
}

export type ProgressCallback = (message: string, completed: number, total: number) => void;
