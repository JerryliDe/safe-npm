import { describe, it, expect } from 'vitest';
import { scanTyposquatting } from '../src/scanner/typosquatting.js';

describe('typosquatting scanner', () => {
  it('should pass for legitimate packages', async () => {
    const result = await scanTyposquatting('lodash');
    expect(result).toHaveLength(0);
  });

  it('should detect single char typo', async () => {
    const result = await scanTyposquatting('loadsh');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('typosquat');
    expect(result[0].severity).toBe('fatal');
  });

  it('should detect common substitutions', async () => {
    const result = await scanTyposquatting('l0dash'); // 0 instead of o
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('typosquat');
  });

  it('should pass for unrelated package names', async () => {
    const result = await scanTyposquatting('my-totally-unique-package');
    expect(result).toHaveLength(0);
  });

  it('should detect scope hijacking and provide correct suggestion', async () => {
    // codex mimics @openai/codex
    const result = await scanTyposquatting('codex');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('typosquat');
    expect(result[0].suggestion).toBe('@openai/codex');
    expect(result[0].details).toContain('Scope Hijacking Detected');
  });
});

