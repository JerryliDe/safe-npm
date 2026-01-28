import { runNpmPassthrough } from '../utils/npm-runner.js';

export async function proxyToNpm(args: string[]): Promise<number> {
  return runNpmPassthrough(args);
}
