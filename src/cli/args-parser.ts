export interface ParsedArgs {
  command: string;
  packages: string[];
  flags: string[];
  isInstall: boolean;
  isForce: boolean;
  isGlobal: boolean;
  isTui: boolean;
  isCheck: boolean;
}

const INSTALL_COMMANDS = ['install', 'i', 'add', 'isntall'];

export function parseArgs(args: string[]): ParsedArgs {
  const command = args[0] || '';
  const restArgs = args.slice(1);

  const flags: string[] = [];
  const packages: string[] = [];

  let isForce = false;
  let isGlobal = false;

  for (const arg of restArgs) {
    if (arg.startsWith('-')) {
      flags.push(arg);
      if (arg === '--force' || arg === '-f') {
        isForce = true;
      }
      if (arg === '-g' || arg === '--global') {
        isGlobal = true;
      }
    } else {
      packages.push(arg);
    }
  }

  const isInstall = INSTALL_COMMANDS.includes(command.toLowerCase());
  const isTui = command === 'tui';
  const isCheck = command === 'check';

  return {
    command,
    packages,
    flags,
    isInstall,
    isForce,
    isGlobal,
    isTui,
    isCheck,
  };
}
