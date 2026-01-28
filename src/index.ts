#!/usr/bin/env node

import { parseArgs } from './cli/args-parser.js';
import { proxyToNpm } from './cli/proxy.js';
import { checkPackages } from './cli/check.js';
import { startTui } from './tui/index.js';
import { hasConfigFile, saveConfig } from './utils/config.js';
import * as readline from 'readline';

async function promptLanguage(): Promise<void> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log('\nWelcome to safe-npm! / 欢迎使用 safe-npm!');
    console.log('Please select your language / 请选择语言:');
    console.log('1. English');
    console.log('2. 中文 (Chinese)');

    rl.question('Select [1/2] (default: 2): ', (answer) => {
      if (answer.trim() === '1') {
        saveConfig({ language: 'en' });
        console.log('Language set to English.\n');
      } else {
        // Default to Chinese as per request context or generic 'other'
        saveConfig({ language: 'zh' });
        console.log('语言已设置为中文。\n');
      }
      rl.close();
      resolve();
    });
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // First run check
  if (!hasConfigFile()) {
    await promptLanguage();
  }

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
