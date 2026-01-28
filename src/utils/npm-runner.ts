import { spawn } from 'child_process';

export interface NpmResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export function runNpm(args: string[]): Promise<NpmResult> {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const command = isWin ? 'cmd.exe' : 'npm';
    // On Windows, use /d /s /c to run the command safely
    // npm.cmd is usually in PATH, but we can specify it directly if needed.
    // Usually 'npm' works inside cmd.
    const finalArgs = isWin ? ['/d', '/s', '/c', 'npm', ...args] : args;

    const child = spawn(command, finalArgs, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });

    child.on('error', () => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: stderr || 'Failed to run npm',
      });
    });
  });
}

export function runNpmPassthrough(args: string[]): Promise<number> {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const command = isWin ? 'cmd.exe' : 'npm';
    const finalArgs = isWin ? ['/d', '/s', '/c', 'npm', ...args] : args;

    const child = spawn(command, finalArgs, {
      stdio: 'inherit',
      shell: false,
    });

    child.on('close', (code) => {
      resolve(code ?? 1);
    });

    child.on('error', () => {
      resolve(1);
    });
  });
}
