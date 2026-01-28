# safe-npm 🛡️

[![npm version](https://img.shields.io/npm/v/@deepv-code/safe-npm.svg)](https://www.npmjs.com/package/@deepv-code/safe-npm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-blue.svg)](https://www.typescriptlang.org/)

**[English Docs](./README.md) | 中文文档**

> **守护您的软件供应链安全。** 在恶意代码触达您的硬盘之前，精准拦截恶意包、误拼包及已知漏洞。

**safe-npm** 是一个专注于安全性的 NPM 命令行包装器。它拦截安装命令，使用多种引擎（VirusTotal、静态分析、拼写检查等）对目标包进行全面扫描，并提供交互式反馈。如果检测到恶意包或拼写错误，它会阻止执行并为您推荐正确的官方包。

---

## ✨ 核心功能

*   **🔍 多引擎扫描**
    *   **集成 VirusTotal**: 将包的 Hash 与全球 70+ 家安全厂商的数据库进行比对。对于未收录的新文件，支持**自动上传**进行云端查杀。
    *   **静态代码分析**: 内置规则引擎，自动检测加密货币挖矿脚本、数据窃取代码及可疑混淆逻辑。
    *   **漏洞检测**: 实时核对 CVE 漏洞数据库。
*   **🚫 防误拼与防劫持 (Typosquatting)**
    *   **误拼检测**: 基于 Levenshtein 距离和模式匹配，识别模仿热门库（如 `reacct` vs `react`）的恶意包。
    *   **Scope 劫持防御**: 针对近期高发的 Scope 攻击进行专项防护（例如：拦截试图冒充 `@anthropic-ai/claude-code` 的 `claude-code` 伪造包）。
*   **💡 智能纠错与建议**
    *   自动识别您原本*想要*安装的包。
    *   提供 "Did you mean...?" 交互式提示，一键安装正确的官方正版包。
*   **🖥️ 交互式终端 (TUI)**
    *   提供精美的终端用户界面，可视化查看扫描进度、检测详情及管理设置。
    *   内置热门 AI Agent 工具推荐列表。
*   **⚡ 无缝替换**
    *   用法与 `npm` 完全一致。只需用 `safe-npm install` 代替 `npm install` 即可。

---

## 🚀 安装

```bash
npm install -g @deepv-code/safe-npm
```

---

## 📖 使用方法

### 1. 安全安装（推荐）
在日常开发中，使用 `safe-npm` 替代 `npm` 来安装依赖。

```bash
# 此命令会在安装前触发完整的安全扫描
safe-npm install react
```

**场景演示：拦截恶意抢注包**
```bash
$ safe-npm install qwen
⚠ Scanning...
✗ qwen: Package not found / Suspicious (未找到包或疑似恶意)
💡 Suggestion: Did you mean to install the official package "@qwen-code/qwen-code"?
(建议：您是否想安装官方包 "@qwen-code/qwen-code"?)
Do you want to install "@qwen-code/qwen-code" instead? (Y/n)
```

### 2. 仅扫描
在不安装的情况下，检查某个包的安全性。

```bash
safe-npm check <package-name>
```

### 3. 交互模式 (TUI)
启动图形化仪表盘，查看热门工具、配置设置或手动扫描。

```bash
safe-npm tui
```

---

## ⚙️ 配置说明

首次运行时，`safe-npm` 会询问您的语言偏好（中文/英文）。

配置文件位于 `~/.safe-npm/config.json`。您可以通过 TUI (`safe-npm tui` -> Settings) 或手动修改配置。

```json
{
  "language": "zh",
  "virustotal": {
    "enabled": true,
    "apiKey": "YOUR_OWN_API_KEY" // 可选：配置您自己的 Key 以获得更高的 API 速率限制
  },
  "offline": false // 设置为 true 可开启离线模式（仅本地检查）
}
```

---

## 🛡️ 安全检测机制详情

| 检测类型 | 说明 |
|------------|-------------|
| **近似名检测 (Typosquatting)** | 内置 150+ 个热门包（含 React, Vue, NestJS, 及各类 AI Agent）的正版名单。通过算法检测名称相似度，严防“李鬼”包。 |
| **VirusTotal 查杀** | 查询文件 Hash。如果该文件是全网首次出现（404），工具会**自动提取并上传**该包到 VirusTotal 服务器进行新鲜查杀。 |
| **代码模式分析** | 扫描硬编码 IP、可疑域名、`eval()` 滥用、挖矿脚本特征等潜在威胁。 |
| **注册表核验** | 验证包是否存在，以及元数据是否合规。 |

---

## 🤝 贡献指南

欢迎提交 Pull Request 来改进这个项目！

1.  Fork 本项目
2.  创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3.  提交您的修改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送到分支 (`git push origin feature/AmazingFeature`)
5.  提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详情请参阅 `LICENSE` 文件。
