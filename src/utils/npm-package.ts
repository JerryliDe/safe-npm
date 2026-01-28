import { exec } from 'child_process';
import { promisify } from 'util';
import { createHash } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, rmSync, existsSync, readdirSync, readFileSync, statSync } from 'fs';
import axios from 'axios';

const execAsync = promisify(exec);

export interface PackageInfo {
  name: string;
  version: string;
  tarballUrl: string;
  tarballSha: string;
  scripts: Record<string, string>;
  main?: string;
  dependencies: Record<string, string>;
}

export interface PackageFiles {
  packageJson: Record<string, unknown>;
  scripts: Record<string, string>;
  entryFile?: string;
  entryContent?: string;
  allJsFiles: { path: string; content: string }[];
}

/**
 * Get package info from npm registry
 */
export async function getPackageInfo(packageName: string): Promise<PackageInfo | null> {
  try {
    // Parse package name and version
    let name = packageName;
    let version = 'latest';

    if (packageName.includes('@') && !packageName.startsWith('@')) {
      const parts = packageName.split('@');
      name = parts[0];
      version = parts[1] || 'latest';
    } else if (packageName.startsWith('@')) {
      // Scoped package like @types/node@1.0.0
      const lastAt = packageName.lastIndexOf('@');
      if (lastAt > 0) {
        name = packageName.substring(0, lastAt);
        version = packageName.substring(lastAt + 1) || 'latest';
      }
    }

    const { stdout } = await execAsync(`npm view ${name}@${version} --json`, {
      timeout: 30000,
    });

    const info = JSON.parse(stdout);

    return {
      name: info.name,
      version: info.version,
      tarballUrl: info.dist?.tarball || '',
      tarballSha: info.dist?.shasum || '',
      scripts: info.scripts || {},
      main: info.main,
      dependencies: info.dependencies || {},
    };
  } catch (error) {
    console.error(`Failed to get package info for ${packageName}:`, error);
    return null;
  }
}

/**
 * Download package tarball and return SHA256 hash
 */
export async function downloadPackageAndHash(tarballUrl: string): Promise<{ hash: string; buffer: Buffer } | null> {
  try {
    const response = await axios.get(tarballUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
    });

    const buffer = Buffer.from(response.data);
    const sha256 = createHash('sha256').update(buffer).digest('hex');

    return { hash: sha256, buffer };
  } catch (error) {
    console.error('Failed to download tarball:', error);
    return null;
  }
}

/**
 * Extract tarball and scan files
 */
export async function extractAndScanPackage(packageName: string): Promise<PackageFiles | null> {
  const tempDir = join(tmpdir(), `safe-npm-scan-${Date.now()}`);

  try {
    mkdirSync(tempDir, { recursive: true });

    // Use npm pack to download the package
    const { stdout } = await execAsync(`npm pack ${packageName} --pack-destination="${tempDir}"`, {
      timeout: 60000,
      cwd: tempDir,
    });

    const tgzFile = stdout.trim();
    const tgzPath = join(tempDir, tgzFile);

    // Extract the tarball
    await execAsync(`tar -xzf "${tgzPath}" -C "${tempDir}"`, {
      timeout: 30000,
    });

    const packageDir = join(tempDir, 'package');

    if (!existsSync(packageDir)) {
      return null;
    }

    // Read package.json
    const packageJsonPath = join(packageDir, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    // Collect all JS files (limit to entry point and install scripts area)
    const allJsFiles: { path: string; content: string }[] = [];
    const filesToScan: string[] = [];

    // Add main entry file
    const mainFile = packageJson.main || 'index.js';
    const mainPath = join(packageDir, mainFile);
    if (existsSync(mainPath)) {
      filesToScan.push(mainPath);
    }

    // Add bin files
    if (packageJson.bin) {
      const bins = typeof packageJson.bin === 'string'
        ? [packageJson.bin]
        : Object.values(packageJson.bin) as string[];
      for (const bin of bins) {
        const binPath = join(packageDir, bin);
        if (existsSync(binPath)) {
          filesToScan.push(binPath);
        }
      }
    }

    // Scan preinstall/postinstall scripts if they reference files
    const scripts = packageJson.scripts || {};
    for (const [scriptName, scriptCmd] of Object.entries(scripts)) {
      if (['preinstall', 'install', 'postinstall'].includes(scriptName)) {
        // Check if script references a JS file
        const cmd = scriptCmd as string;
        const jsMatch = cmd.match(/node\s+([^\s]+\.js)/);
        if (jsMatch) {
          const scriptPath = join(packageDir, jsMatch[1]);
          if (existsSync(scriptPath)) {
            filesToScan.push(scriptPath);
          }
        }
      }
    }

    // Read files to scan
    for (const filePath of filesToScan) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        allJsFiles.push({
          path: filePath.replace(packageDir, ''),
          content,
        });
      } catch {
        // Skip unreadable files
      }
    }

    // Get entry content
    let entryContent: string | undefined;
    if (existsSync(mainPath)) {
      try {
        entryContent = readFileSync(mainPath, 'utf-8');
      } catch {
        // Ignore
      }
    }

    return {
      packageJson,
      scripts: packageJson.scripts || {},
      entryFile: mainFile,
      entryContent,
      allJsFiles,
    };
  } catch (error) {
    console.error('Failed to extract package:', error);
    return null;
  } finally {
    // Cleanup temp directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}
