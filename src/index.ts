#!/usr/bin/env node

import { parseArgs } from './cli/args-parser.js';
import { proxyToNpm } from './cli/proxy.js';
import { checkPackages } from './cli/check.js';
import { startTui } from './tui/index.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Show help or start TUI
    console.log('safe-npm - A security-focused npm wrapper');
    console.log('');
    console.log('Usage:');
    console.log('  safe-npm <npm-command>    Proxy npm commands with security checks');
    console.log('  safe-npm check <pkg>      Check package without installing');
    console.log('  safe-npm tui              Open interactive TUI');
    console.log('');
    process.exit(0);
  }

  const parsed = parseArgs(args);

  if (parsed.isTui) {
    startTui();
    // Don't exit - Ink handles the process
    return;
  }

  if (parsed.isCheck) {
    await checkPackages(parsed.packages);
    process.exit(0);
  }

  if (parsed.isInstall && parsed.packages.length > 0) {
    // Security scan before install
    const safe = await checkPackages(parsed.packages, {
      isForce: parsed.isForce,
      install: true,
    });

    if (!safe) {
      process.exit(1);
    }
  }

  // Proxy to npm
  const exitCode = await proxyToNpm(args);
  process.exit(exitCode);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
