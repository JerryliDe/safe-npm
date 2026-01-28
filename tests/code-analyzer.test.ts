import { describe, it, expect } from 'vitest';
import { checkMinerPatterns } from '../src/scanner/patterns/miner.js';
import { checkExfiltrationPatterns } from '../src/scanner/patterns/exfiltration.js';

describe('miner pattern detection', () => {
  it('should detect coinhive', () => {
    const code = 'var miner = new CoinHive.Anonymous("site-key");';
    const result = checkMinerPatterns(code);
    expect(result.matched).toBe(true);
  });

  it('should detect mining pool connections', () => {
    const code = 'connect("stratum+tcp://pool.example.com:3333")';
    const result = checkMinerPatterns(code);
    expect(result.matched).toBe(true);
  });

  it('should pass clean code', () => {
    const code = 'console.log("hello world");';
    const result = checkMinerPatterns(code);
    expect(result.matched).toBe(false);
  });
});

describe('exfiltration pattern detection', () => {
  it('should detect direct IP connections', () => {
    const code = 'fetch("http://192.168.1.1/data")';
    const findings = checkExfiltrationPatterns(code);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should detect suspicious TLDs', () => {
    const code = 'axios.get("https://evil.tk/steal")';
    const findings = checkExfiltrationPatterns(code);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should pass normal URLs', () => {
    const code = 'fetch("https://api.github.com/repos")';
    const findings = checkExfiltrationPatterns(code);
    expect(findings.length).toBe(0);
  });
});
