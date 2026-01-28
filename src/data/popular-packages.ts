// Popular packages that are commonly typosquatted
// Source: Top NPM packages by downloads
export const popularPackages = [
  // --- Frameworks & Libraries ---
  'react', 'react-dom', 'vue', 'angular', 'svelte', 'preact', 'solid-js', 'qwik',
  'next', 'nuxt', 'gatsby', 'remix', 'astro',
  'express', 'fastify', 'koa', 'nestjs', 'meteor', 'sails',
  'jquery', 'backbone', 'ember-cli', 'bootstrap', 'tailwindcss', 'bulma',
  'three', 'pixi.js', 'd3', 'chart.js', 'recharts',
  'socket.io', 'socket.io-client', 'ws',

  // --- State Management ---
  'redux', 'react-redux', '@reduxjs/toolkit', 'mobx', 'mobx-react', 'vuex', 'pinia', 'zustand', 'jotai', 'recoil', 'xstate',

  // --- Utilities & Helpers ---
  'lodash', 'underscore', 'ramda', 'immutable', 'rxjs',
  'moment', 'dayjs', 'date-fns', 'luxon',
  'uuid', 'nanoid', 'shortid',
  'chalk', 'colors', 'kleur', 'ansi-styles',
  'classnames', 'clsx',
  'qs', 'query-string',
  'semver', 'minimist', 'yargs', 'commander', 'inquirer', 'prompts', 'ora',
  'debug', 'ms', 'dotenv', 'cross-env', 'rimraf', 'mkdirp', 'fs-extra',
  'glob', 'minimatch', 'chokidar',

  // --- Network & Requests ---
  'axios', 'node-fetch', 'got', 'request', 'superagent', 'undici', 'ky', 'swr', 'react-query', '@tanstack/react-query',

  // --- Build Tools & Compilers ---
  'typescript', 'ts-node', 'tslib',
  'webpack', 'webpack-cli', 'webpack-dev-server',
  'vite', 'rollup', 'esbuild', 'parcel', 'turbopack',
  'babel-core', '@babel/core', '@babel/preset-env', '@babel/preset-react',
  'swc', 'postcss', 'autoprefixer', 'sass', 'less', 'stylus',

  // --- Testing ---
  'jest', 'mocha', 'chai', 'jasmine', 'karma',
  'vitest', 'cypress', 'playwright', 'puppeteer', 'selenium-webdriver',
  'testing-library', '@testing-library/react',
  'supertest',

  // --- Linting & Formatting ---
  'eslint', 'prettier', 'stylelint', 'husky', 'lint-staged', 'commitizen',

  // --- Node.js Core & Server ---
  'cookie-parser', 'body-parser', 'cors', 'morgan', 'helmet', 'compression',
  'multer', 'jsonwebtoken', 'passport', 'bcrypt', 'bcryptjs',
  'mongoose', 'sequelize', 'typeorm', 'prisma', '@prisma/client',
  'pg', 'mysql2', 'mysql', 'sqlite3', 'redis', 'mongodb',

  // --- Cloud & DevOps ---
  'aws-sdk', '@aws-sdk/client-s3', 'firebase', 'firebase-admin', '@google-cloud/storage',
  'serverless', 'pm2', 'nodemon', 'forever',

  // --- CI/CD & Others ---
  'npm-run-all', 'concurrently',
  'shelljs', 'execa',
  'xml2js', 'js-yaml',
  'winston', 'bunyan', 'pino',
  'sharp', 'jimp',

  // --- Scoped Packages Protection ---
  '@anthropic-ai/claude-code',
  '@qwen-code/qwen-code',
  '@openai/codex',

  // --- Recent Hot Packages ---
  'clawdbot',
];

export const popularGlobalTools = [
  { name: 'typescript', desc: 'TypeScript compiler' },
  { name: 'eslint', desc: 'JavaScript linter' },
  { name: 'prettier', desc: 'Code formatter' },
  { name: 'npm-check-updates', desc: 'Update dependencies' },
  { name: 'nodemon', desc: 'Auto-restart Node.js' },
  { name: 'tsx', desc: 'TypeScript execute' },
  { name: 'pnpm', desc: 'Fast package manager' },
  { name: 'yarn', desc: 'Alternative package manager' },
  { name: 'vercel', desc: 'Vercel CLI' },
  { name: 'netlify-cli', desc: 'Netlify CLI' },
  { name: 'create-react-app', desc: 'React project generator' },
  { name: 'create-next-app', desc: 'Next.js project generator' },
  { name: 'vue-cli', desc: 'Vue CLI' },
  { name: '@vue/cli', desc: 'Vue CLI' },
  { name: 'nest', desc: 'NestJS CLI' },
  { name: '@nestjs/cli', desc: 'NestJS CLI' },
];

export const popularAgents = [
  { name: 'deepv-code', desc: 'DeepV Code AI Assistant' },
  { name: '@qwen-code/qwen-code', desc: 'Qwen Code Official' },
  { name: '@anthropic-ai/claude-code', desc: 'Claude Code Official' },
  { name: '@openai/codex', desc: 'OpenAI Codex Official' },
  { name: 'clawdbot', desc: 'WhatsApp Gateway Agent' },
];
