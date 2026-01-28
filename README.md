# safe-npm 🛡️

[![npm version](https://img.shields.io/npm/v/@deepv-code/safe-npm.svg)](https://www.npmjs.com/package/@deepv-code/safe-npm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-blue.svg)](https://www.typescriptlang.org/)

**[中文文档](./README.zh-CN.md) | English Docs**

> **Guard your supply chain.** Detect malicious packages, typosquatting attacks, and known vulnerabilities *before* they touch your disk.

**safe-npm** is a security-focused wrapper for the NPM CLI. It intercepts installation commands, scans target packages using multiple engines (VirusTotal, Static Analysis, etc.), and provides interactive feedback. If a package is suspicious or a typo is detected, it blocks execution and suggests the correct official package.

---

## ✨ Key Features

*   **🔍 Multi-Engine Scanning**
    *   **VirusTotal Integration**: Checks package hashes against 70+ security vendors. Automatically uploads unknown files for analysis.
    *   **Static Code Analysis**: Detects crypto-miners, data exfiltration scripts, and suspicious obfuscation.
    *   **Vulnerability Check**: Cross-references against known CVE databases.
*   **🚫 Typosquatting Protection**
    *   Detects package names that mimic popular libraries (e.g., `reacct` vs `react`).
    *   **Scope Hijacking Defense**: Prevents installing fake unscoped packages that mimic official scoped ones (e.g., detects `claude-code` attempting to impersonate `@anthropic-ai/claude-code`).
*   **💡 Smart Suggestions**
    *   Automatically identifies the package you *intended* to install.
    *   "Did you mean...?" interactive prompt to one-click install the correct package.
*   **🖥️ Interactive TUI**
    *   A beautiful Terminal User Interface for exploring checks and managing settings.
    *   Real-time scanning progress and detailed reports.
*   **⚡ Drop-in Replacement**
    *   Works just like `npm`. Use `safe-npm install` instead of `npm install`.

---

## 🚀 Installation

```bash
npm install -g @deepv-code/safe-npm
```

---

## 📖 Usage

### 1. Safe Installation (Recommended)
Use `safe-npm` as a replacement for `npm` when installing packages.

```bash
# This triggers a full security scan before installation
safe-npm install react
```

**Scenario: Typosquatting Interception**
```bash
$ safe-npm install qwen
⚠ Scanning...
✗ qwen: Package not found / Suspicious
💡 Suggestion: Did you mean to install the official package "@qwen-code/qwen-code"?
Do you want to install "@qwen-code/qwen-code" instead? (Y/n)
```

### 2. Check a Package
Scan a package without installing it.

```bash
safe-npm check <package-name>
```

### 3. Interactive Mode (TUI)
Launch the dashboard to check popular agents, configure settings, or manually scan packages.

```bash
safe-npm tui
```

---

## ⚙️ Configuration

On the first run, `safe-npm` will ask for your preferred language (English/Chinese).

Configuration is stored in `~/.safe-npm/config.json`. You can modify it manually or via the TUI (`safe-npm tui` -> Settings).

```json
{
  "language": "en",
  "virustotal": {
    "enabled": true,
    "apiKey": "YOUR_OWN_API_KEY" // Optional: Use your own key for higher rate limits
  },
  "offline": false
}
```

---

## 🛡️ Security Checks Explained

| Check Type | Description |
|------------|-------------|
| **Typosquatting** | Uses Levenshtein distance and pattern matching against a curated list of top 150+ popular packages (React, Vue, NestJS, AI Agents, etc.) to detect impostors. |
| **VirusTotal** | queries the file hash. If the file is new (404), it **automatically uploads** the tarball to VirusTotal for a fresh scan. |
| **Code Patterns** | Scans for hardcoded IPs, suspicious domains, `eval()` abuse, and known crypto-mining signatures. |
| **Registry** | Verifies package existence and metadata consistency. |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
