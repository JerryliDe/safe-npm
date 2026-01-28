import chalk from 'chalk';
import ora from 'ora';
import { t } from '../i18n/index.js';
import { scanPackage, type ScanResult } from '../scanner/index.js';

export interface CheckOptions {
  isForce?: boolean;
  install?: boolean;
}

function formatResult(result: ScanResult): void {
  const { packageName, riskLevel, issues, canBypass } = result;

  if (riskLevel === 'safe') {
    console.log(chalk.green(`✓ ${packageName}: ${t('riskSafe')}`));
    return;
  }

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
  console.log('');
  console.log(levelColor(`⚠ ${packageName}: ${riskLabels[riskLevel]}`));
  console.log('');

  for (const issue of issues) {
    console.log(`  [!] ${issue.message}`);
    if (issue.details) {
      console.log(chalk.dim(`      ${issue.details}`));
    }
  }

  console.log('');

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
    const result = await scanPackage(pkg);
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
  }

  return allSafe;
}
