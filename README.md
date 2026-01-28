# safe-npm

A security-focused npm wrapper that scans packages before installation.

## Features

- **Malware Detection**: Checks packages against VirusTotal and local blacklist
- **Typosquatting Protection**: Detects packages with names similar to popular packages
- **Code Analysis**: Scans postinstall scripts and entry points for suspicious patterns
- **Miner Detection**: Identifies crypto-mining scripts
- **CVE Checking**: Reports known vulnerabilities
- **Multi-language**: Supports English and Chinese

## Installation

```bash
npm install -g safe-npm
```

## Usage

### Proxy Mode (Default)

Use safe-npm as a drop-in replacement for npm:

```bash
safe-npm install lodash
safe-npm install -g typescript
safe-npm run build
```

### Check Mode

Scan a package without installing:

```bash
safe-npm check suspicious-package
```

### TUI Mode

Open interactive interface:

```bash
safe-npm tui
```

## Risk Levels

| Level | Action |
|-------|--------|
| Fatal | Blocked, cannot bypass (virus, typosquat) |
| High | Blocked by default, use `--force` to bypass |
| Warning | Shows warning, continues installation |
| Safe | No issues found |

## Configuration

Config file: `~/.safe-npm/config.json`

```json
{
  "language": "en",
  "virustotal": {
    "apiKey": "your-api-key",
    "enabled": true
  },
  "offline": false
}
```

## License

MIT
