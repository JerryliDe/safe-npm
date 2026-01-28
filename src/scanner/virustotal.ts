import type { ScanIssue, ScanOptions } from './types.js';
import { t } from '../i18n/index.js';
import { getConfig } from '../utils/config.js';
import { getPackageInfo, downloadPackageAndHash } from '../utils/npm-package.js';
import axios from 'axios';
import FormData from 'form-data';

// Local blacklist cache for offline mode
// Source: Known malicious npm packages from security advisories
const localBlacklist = new Set([
  // Real known malicious packages
  'event-stream', // Compromised in 2018, version 3.3.6
  'flatmap-stream', // Malicious dependency of event-stream
  'eslint-scope', // Compromised in 2018
  'eslint-config-eslint', // Typosquat
  'crossenv', // Typosquat of cross-env
  'cross-env.js', // Typosquat of cross-env
  'mongose', // Typosquat of mongoose
  'mariadb', // Malicious package (not the real one)
  'discordi.js', // Typosquat of discord.js
  'discord.js-user', // Malicious
  'colors-js', // Typosquat
  'nodejs-base64', // Malicious
  'nodesass', // Typosquat of node-sass
  'nodefabric', // Malicious
  'node-fabric', // Malicious
  'fabric-js', // Typosquat
  'grpc-js', // Typosquat of @grpc/grpc-js
  'sqlite.js', // Typosquat
  'sqlite-js', // Typosquat
  'mssql.js', // Typosquat
  'mssql-node', // Typosquat
  'lodash-js', // Typosquat
  'loadsh', // Typosquat
  'lodashs', // Typosquat
  'underscore-js', // Typosquat
  'underscores', // Typosquat
  'babel-preset-es2016', // Typosquat
  'babelpreset-es2015', // Typosquat
  'rc-js', // Typosquat
  'rpc-websocket', // Malicious
  'jquey', // Typosquat of jquery
  'jquery.js', // Typosquat
  'jqeury', // Typosquat
  'boostrap', // Typosquat of bootstrap
  'bootstrap-css', // Typosquat
  'angularjs', // Typosquat
  'angular.js', // Typosquat
  'react.js', // Typosquat
  'react-js', // Typosquat
  'vue-js', // Typosquat
  'twilio-npm', // Malicious
  'discord-selfbot-v13', // Malicious
  'discord-lofy', // Malicious
]);

// Known malicious package version ranges
const maliciousVersions: Record<string, string[]> = {
  'event-stream': ['3.3.6'],
  'ua-parser-js': ['0.7.29', '0.8.0', '1.0.0'],
  'coa': ['2.0.3', '2.0.4', '2.1.1', '2.1.3', '3.0.1', '3.1.3'],
  'rc': ['1.2.9', '1.3.9', '2.3.9'],
};

interface VirusTotalResponse {
  data?: {
    attributes?: {
      last_analysis_stats?: {
        malicious: number;
        suspicious: number;
        undetected: number;
        harmless: number;
      };
      last_analysis_results?: Record<string, {
        category: string;
        result: string | null;
        engine_name: string;
      }>;
    };
  };
}

/**
 * Get a special upload URL for files larger than 32MB
 */
async function getLargeFileUploadUrl(apiKey: string): Promise<string | null> {
    try {
        const response = await axios.get<{ data: string }>('https://www.virustotal.com/api/v3/files/upload_url', {
             headers: { 'x-apikey': apiKey },
             timeout: 30000,
        });
        return response.data?.data || null;
    } catch (e) {
        console.error('Failed to get VT upload URL', e);
        return null;
    }
}

/**
 * Upload file to VirusTotal for analysis
 */
async function uploadFileToVirusTotal(buffer: Buffer, filename: string, apiKey: string): Promise<string | null> {
    try {
        const formData = new FormData();
        formData.append('file', buffer, { filename });

        let uploadUrl = 'https://www.virustotal.com/api/v3/files';

        // VirusTotal requires a special upload URL for files > 32MB
        // Using 32MB limit to be safe (API doc says 32MB)
        if (buffer.length > 32 * 1024 * 1024) {
             const customUrl = await getLargeFileUploadUrl(apiKey);
             if (customUrl) {
                 uploadUrl = customUrl;
             }
        }

        const response = await axios.post(uploadUrl, formData, {
            headers: {
                'x-apikey': apiKey,
                ...formData.getHeaders(),
            },
            // Increase timeout significantly for uploads (10 minutes)
            timeout: 600000,
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        // Returns the analysis ID (e.g., "ZmY5...")
        return response.data?.data?.id || null;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
            console.error('VirusTotal Upload Timeout: File too large or network too slow');
        } else {
            console.error('VirusTotal Upload Error:', error?.message || error);
        }
        return null;
    }
}

/**
 * Query VirusTotal API for file hash
 */
async function queryVirusTotal(sha256: string, apiKey: string): Promise<{ malicious: number; suspicious: number; detections: string[] } | null> {
  try {
    const response = await axios.get<VirusTotalResponse>(
      `https://www.virustotal.com/api/v3/files/${sha256}`,
      {
        headers: {
          'x-apikey': apiKey,
        },
        timeout: 30000,
        validateStatus: (status) => status === 200 || status === 404,
      }
    );

    if (response.status === 404) {
      // File not found in VirusTotal - not necessarily bad
      return null;
    }

    const stats = response.data?.data?.attributes?.last_analysis_stats;
    const results = response.data?.data?.attributes?.last_analysis_results;

    if (!stats) {
      return null;
    }

    // Collect detection names
    const detections: string[] = [];
    if (results) {
      for (const [engine, result] of Object.entries(results)) {
        if (result.category === 'malicious' && result.result) {
          detections.push(`${engine}: ${result.result}`);
        }
      }
    }

    return {
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      detections,
    };
  } catch (error) {
    console.error('VirusTotal API error:', error);
    return null;
  }
}

interface VTScanResult {
  issues: ScanIssue[];
  info?: string;
}

export async function scanVirusTotal(
  packageName: string,
  options: ScanOptions = {}
): Promise<VTScanResult> {
  const issues: ScanIssue[] = [];
  const config = getConfig();

  // Parse package name without version
  let baseName = packageName;
  if (packageName.includes('@') && !packageName.startsWith('@')) {
    baseName = packageName.split('@')[0];
  } else if (packageName.startsWith('@')) {
    const lastAt = packageName.lastIndexOf('@');
    if (lastAt > 0) {
      baseName = packageName.substring(0, lastAt);
    }
  }

  // Check local blacklist first
  if (localBlacklist.has(baseName)) {
    issues.push({
      type: 'virus',
      severity: 'fatal',
      message: t('virusDetected'),
      details: `Package "${baseName}" is in the known malicious packages blacklist`,
    });
    return { issues, info: 'Blocked by local blacklist' };
  }

  // Get package info to check version
  const packageInfo = await getPackageInfo(packageName);

  if (packageInfo) {
    // Check for known malicious versions
    const badVersions = maliciousVersions[packageInfo.name];
    if (badVersions && badVersions.includes(packageInfo.version)) {
      issues.push({
        type: 'virus',
        severity: 'fatal',
        message: t('virusDetected'),
        details: `Version ${packageInfo.version} of "${packageInfo.name}" is known to be compromised`,
      });
      return { issues, info: 'Blocked by malicious version list' };
    }
  }

  // If offline mode or no API key, skip online check
  if (options.offline || config.offline) {
    return { issues, info: 'Skipped (Offline Mode)' };
  }

  if (!config.virustotal.apiKey || !config.virustotal.enabled) {
    // No API key configured, skip VT check but don't warn
    return { issues, info: 'Skipped (No API Key)' };
  }

  // Download package and calculate hash
  if (packageInfo?.tarballUrl) {
    const downloadResult = await downloadPackageAndHash(packageInfo.tarballUrl);

    if (downloadResult) {
      const vtResult = await queryVirusTotal(downloadResult.hash, config.virustotal.apiKey);

      if (vtResult) {
          const totalEngines = (vtResult.malicious || 0) + (vtResult.suspicious || 0) + 70; // Estimate
          const info = `Scanned Hash: ${downloadResult.hash.substring(0, 8)}... | Detections: ${vtResult.malicious}/${totalEngines}`;

          if (vtResult.malicious > 0) {
            issues.push({
              type: 'virus',
              severity: 'fatal',
              message: t('virusDetected'),
              details: `VirusTotal: ${vtResult.malicious} security vendors flagged this package as malicious. Detections: ${vtResult.detections.slice(0, 3).join(', ')}${vtResult.detections.length > 3 ? '...' : ''}`,
            });
          } else if (vtResult.suspicious > 2) {
            issues.push({
              type: 'virus',
              severity: 'high',
              message: t('virusDetected'),
              details: `VirusTotal: ${vtResult.suspicious} security vendors flagged this package as suspicious`,
            });
          }
          return { issues, info };
      } else {
          // File not found in VT, upload it
          const analysisId = await uploadFileToVirusTotal(downloadResult.buffer, `${packageInfo.name}-${packageInfo.version}.tgz`, config.virustotal.apiKey);

          if (analysisId) {
             return {
                 issues,
                 info: `File not found in VT. Uploaded for analysis. View: https://www.virustotal.com/gui/file-analysis/${analysisId}`
             };
          } else {
             return {
                 issues,
                 info: `Hash ${downloadResult.hash.substring(0, 8)}... not found in VirusTotal (Upload failed)`
             };
          }
      }
    }
  }

  return { issues, info: 'Could not download package for scanning' };
}
