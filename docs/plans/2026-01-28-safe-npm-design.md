# safe-npm 设计文档

## 概述

safe-npm 是一个 npm 的安全包装器，在安装包之前进行多维度安全检测，帮助开发者防范恶意 npm 包。

## 核心功能

- **代理模式**：透传所有 npm 命令，仅拦截 install 相关命令进行安全检测
- **TUI 交互界面**：提供热门包推荐、手动检测等功能
- **多语言支持**：支持中文和英文，默认英文，可在 TUI 中设置

## 整体架构

```
┌─────────────────────────────────────────────────────┐
│                    safe-npm CLI                      │
├─────────────────────────────────────────────────────┤
│  命令入口层                                          │
│  ├── 代理模式：透传所有 npm 命令                      │
│  ├── TUI 模式：safe-npm tui 进入交互界面              │
│  └── 检测模式：safe-npm check <pkg> 手动检测          │
├─────────────────────────────────────────────────────┤
│  安全检测引擎（仅在 install 相关命令时触发）           │
│  ├── VirusTotal 查询器（已知病毒包）                  │
│  ├── Typosquatting 检测器（仿冒包）                   │
│  ├── 代码扫描器（postinstall + 入口文件）             │
│  └── 漏洞查询器（npm audit / CVE）                   │
├─────────────────────────────────────────────────────┤
│  数据层                                              │
│  ├── 本地缓存（黑名单、检测结果）                      │
│  └── 在线服务（VirusTotal API、npm registry）        │
└─────────────────────────────────────────────────────┘
```

## 安全检测策略

### 风险等级与处理方式

| 风险类型 | 等级 | 处理方式 |
|---------|------|---------|
| VirusTotal 已知病毒包 | 致命 | 直接阻止，不可绕过 |
| Typosquatting 仿冒包 | 致命 | 直接阻止，不可绕过 |
| 恶意行为特征（可疑代码） | 高危 | 显示特征详情，默认阻止，可 `--force` 绕过 |
| 已知 CVE 漏洞 | 警告 | 明显提示后继续安装 |

### 恶意行为特征检测范围

扫描 postinstall 脚本 + 包入口文件，检测模式包括：

- 环境变量窃取（`process.env` 外传）
- 可疑网络请求（非常规域名、IP 直连）
- 文件系统敏感操作（读取 `~/.ssh`、`~/.npmrc` 等）
- 代码混淆/加密特征
- 危险命令执行（`exec`、`spawn` 执行可疑命令）
- **挖矿脚本特征**（crypto-miner 模式、连接矿池等）

### 数据源策略

- 默认在线查询 VirusTotal、npm registry
- 本地维护黑名单缓存，定期同步
- 离线时回退到本地缓存，给出提示

## 命令行接口

### 代理模式（默认）

```bash
# 所有 npm 命令透传，用法完全一致
safe-npm install lodash
safe-npm install -g typescript
safe-npm install --save-dev jest
safe-npm run build
safe-npm publish

# 检测到风险时的 --force 绕过（仅适用于高危级别）
safe-npm install suspicious-pkg --force
```

### 手动检测模式

```bash
# 仅检测风险，不安装
safe-npm check lodash
safe-npm check some-unknown-pkg
```

### TUI 交互模式

```bash
# 进入交互界面
safe-npm tui
```

TUI 界面功能：
- 热门全局工具推荐列表（内置静态列表），一键安装
- 输入包名手动检测风险
- 查看最近安装的包及其检测结果
- 设置语言（中文/英文）

### 输出示例

检测到高危风险时：

```
⚠️  Suspicious behavior detected: suspicious-pkg@1.0.0

  [!] postinstall script executes suspicious command
  [!] Crypto-miner pattern detected
  [!] HTTP request to unknown IP address

Installation blocked. Use --force to install anyway if you're sure it's safe.
```

## 项目结构

```
safe-npm/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                 # CLI 入口
│   ├── cli/
│   │   ├── proxy.ts             # npm 命令代理透传
│   │   ├── check.ts             # 手动检测命令
│   │   └── args-parser.ts       # 参数解析
│   ├── tui/
│   │   ├── App.tsx              # Ink TUI 主组件
│   │   ├── components/
│   │   │   ├── PackageList.tsx  # 热门包推荐列表
│   │   │   ├── Scanner.tsx      # 检测界面
│   │   │   └── Settings.tsx     # 设置界面（含语言切换）
│   │   └── hooks/
│   ├── scanner/
│   │   ├── index.ts             # 检测引擎入口
│   │   ├── virustotal.ts        # VirusTotal 查询
│   │   ├── typosquatting.ts     # 仿冒包检测
│   │   ├── code-analyzer.ts     # 代码特征扫描
│   │   ├── vulnerability.ts     # CVE 漏洞查询
│   │   └── patterns/
│   │       ├── miner.ts         # 挖矿脚本特征
│   │       ├── exfiltration.ts  # 数据窃取特征
│   │       └── obfuscation.ts   # 代码混淆特征
│   ├── data/
│   │   ├── popular-packages.ts  # 内置热门包列表
│   │   └── blacklist.ts         # 本地黑名单缓存
│   ├── i18n/
│   │   ├── index.ts             # 多语言入口
│   │   ├── en.ts                # 英文
│   │   └── zh.ts                # 中文
│   └── utils/
│       ├── cache.ts             # 本地缓存管理
│       ├── config.ts            # 用户配置
│       └── npm-runner.ts        # npm 子进程调用
├── tests/
└── README.md
```

## 技术栈

- **运行时**：Node.js (TypeScript)
- **TUI 框架**：Ink + React
- **CLI 解析**：commander / yargs
- **HTTP 请求**：axios

## 数据流

```
用户输入 safe-npm install <pkg>
         │
         ▼
    解析命令参数
         │
         ▼
    是 install 相关命令？ ──否──▶ 直接透传给 npm
         │
        是
         ▼
    ┌────────────────────────────┐
    │     并行安全检测           │
    │  ├── VirusTotal 查询       │
    │  ├── Typosquatting 检测    │
    │  ├── 代码特征扫描          │
    │  └── CVE 漏洞查询          │
    └────────────────────────────┘
         │
         ▼
    汇总检测结果
         │
         ├── 致命风险 ──▶ 阻止安装，退出
         │
         ├── 高危风险 ──▶ 有 --force？
         │                 ├── 是 ──▶ 继续安装
         │                 └── 否 ──▶ 阻止安装
         │
         └── 警告/安全 ──▶ 显示提示，继续安装
                              │
                              ▼
                      调用 npm install 执行安装
```

## 错误处理

| 场景 | 处理方式 |
|-----|---------|
| VirusTotal API 超时/离线 | 回退本地黑名单，提示网络异常 |
| npm registry 不可达 | 报错退出（同 npm 原生行为） |
| 本地缓存损坏 | 重建缓存，提示用户 |
| 未知错误 | 透传给 npm，不阻断用户操作 |

## 配置

配置文件位置：`~/.safe-npm/config.json`

```json
{
  "language": "en",
  "virustotal": {
    "apiKey": "",
    "enabled": true
  },
  "offline": false,
  "cache": {
    "ttl": 86400
  }
}
```

## 内置热门包列表

首批推荐的全局工具（经过安全验证）：

- typescript - TypeScript compiler
- eslint - JavaScript linter
- prettier - Code formatter
- npm-check-updates - Update dependencies
- nodemon - Auto-restart Node.js
- tsx - TypeScript execute
- pnpm - Fast package manager

## 未来扩展（不在本次范围）

- CI/CD 集成模式
- 自定义检测规则
- 团队共享黑白名单
- 更深层的依赖链扫描
