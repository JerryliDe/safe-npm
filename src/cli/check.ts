import chalk from 'chalk';
import ora from 'ora';
import * as readline from 'readline';
import { t } from '../i18n/index.js';
import { scanPackage, type ScanResult } from '../scanner/index.js';
import { runNpm } from '../utils/npm-runner.js';

export interface CheckOptions {
  isForce?: boolean;
  install?: boolean;
}

async function promptInstallCorrect(correctPackage: string): Promise<boolean> {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        console.log(chalk.cyan(`\n${t('suggestionTitle')} "${chalk.bold(correctPackage)}"?`));
        rl.question(`${t('suggestionPrompt')} "${correctPackage}"? (Y/n) `, (answer) => {
            rl.close();
            if (answer.toLowerCase() === 'n') {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

function formatResult(result: ScanResult): void {
  const { packageName, riskLevel, issues, canBypass, checks } = result;

  const levelColors = {
    fatal: chalk.bgRed.white,
    high: chalk.red,
    warning: chalk.yellow,
    safe: chalk.green,
  };

  const riskLabels: Record<string, string> = {
    fatal: t('riskFatal'),
    high: t('riskHigh'),
    warning: t('riskWarning'),
    safe: t('riskSafe'),
  };

  const levelColor = levelColors[riskLevel];

  if (riskLevel === 'safe') {
    console.log(chalk.green(`✓ ${packageName}: ${riskLabels[riskLevel]}`));
  } else {
    console.log('');
    // Special handling for "Not Found" case to be friendlier
    if (checks.some(c => c.name === 'Registry Check' && c.status === 'fail')) {
         console.log(chalk.red(`✗ ${packageName}: ${t('packageNotFound')}`));
    } else {
         console.log(levelColor(`⚠ ${packageName}: ${riskLabels[riskLevel]}`));
    }
  }

  // Print Details
  if (checks && checks.length > 0) {
      console.log(chalk.dim('\n  Scan Details:'));
      for (const check of checks) {
          const icon = check.status === 'pass' ? chalk.green('✓') :
                       check.status === 'fail' ? chalk.red('✗') :
                       chalk.gray('○');
          const desc = check.description ? chalk.dim(`- ${check.description}`) : '';
          console.log(`  ${icon} ${check.name} ${desc}`);
      }
      console.log('');
  }

  if (issues.length > 0) {
    for (const issue of issues) {
        console.log(`  [!] ${issue.message}`);
        if (issue.details) {
        console.log(chalk.dim(`      ${issue.details}`));
        }
    }
    console.log('');
  }

  if (riskLevel === 'safe') return;

  if (!canBypass) {
    console.log(chalk.red(`✗ ${t('blocked')} - ${t('cannotBypass')}`));
  } else if (riskLevel === 'high') {
    console.log(chalk.red(`✗ ${t('blocked')}`));
    console.log(chalk.dim(`  ${t('useForce')}`));
  } else {
    console.log(chalk.yellow(`⚠ ${t('continuing')}`));
  }
}

export async function checkPackages(
  packages: string[],
  options: CheckOptions = {}
): Promise<boolean> {
  if (packages.length === 0) {
    console.log('No packages specified to check');
    return true;
  }

  const spinner = ora(`${t('scanning')}...`).start();

  let allSafe = true;
  const results: ScanResult[] = [];

  for (const pkg of packages) {
    spinner.text = `${t('scanning')}: ${pkg}`;
    const result = await scanPackage(pkg, {}, (msg, completed, total) => {
        spinner.text = `${t('scanning')} ${pkg}: ${msg} (${completed}/${total})`;
    });
    results.push(result);

    if (result.riskLevel === 'fatal') {
      allSafe = false;
    } else if (result.riskLevel === 'high' && !options.isForce) {
      allSafe = false;
    }
  }

  spinner.stop();

  console.log(chalk.bold(`\n${t('scanComplete')}\n`));

  for (const result of results) {
    formatResult(result);

    // Auto-fix suggestion for install mode
    if (options.install && result.riskLevel === 'fatal' && result.suggestedPackage) {
         const shouldInstall = await promptInstallCorrect(result.suggestedPackage);
         if (shouldInstall) {
             console.log(chalk.green(`\n${t('installingCorrect')}: ${result.suggestedPackage}...`));
             await runNpm(['install', result.suggestedPackage]);
             // Return false to stop the original (malicious) installation logic
             // But we essentially succeeded in the user's intent.
             // However, to keep flow clean, we exit the process here or return false to block original.
             process.exit(0);
         }
    }
  }

  return allSafe;
}
