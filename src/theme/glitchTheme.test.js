import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const themePath = join(dirname(fileURLToPath(import.meta.url)), 'glitch.css');

describe('dark mode glitch art theme', () => {
  it('declares a dark color-scheme and glitch tokens without remote assets', () => {
    const css = readFileSync(themePath, 'utf8');
    expect(css).toMatch(/color-scheme:\s*dark/);
    expect(css).toMatch(/--glitch-int/);
    expect(css).toMatch(/--crt-opacity/);
    expect(css).toMatch(/--noise-opacity/);
    expect(css).toMatch(/--aether-bg/);
    expect(css).not.toMatch(/https:\/\//);
  });

  it('includes CRT, grain, and RGB-split glitch treatments', () => {
    const css = readFileSync(themePath, 'utf8');
    expect(css).toMatch(/\.crt-overlay/);
    expect(css).toMatch(/\.noise-overlay/);
    expect(css).toMatch(/@keyframes rgb-split/);
    expect(css).toMatch(/prefers-reduced-motion/);
  });
});
