import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PACKAGES = ['core', 'angular', 'capacitor'];

describe('THIRD_PARTY_LICENSES file', () => {
  const rootLicense = join(ROOT, 'THIRD_PARTY_LICENSES');

  it('exists at repo root', () => {
    expect(existsSync(rootLicense)).toBe(true);
  });

  const content = existsSync(rootLicense) ? readFileSync(rootLicense, 'utf8') : '';

  it('attributes web-vitals under Apache 2.0', () => {
    expect(content).toMatch(/web-vitals/);
    expect(content).toMatch(/Google/);
  });

  it('attributes the OpenTelemetry JS bundled packages under Apache 2.0', () => {
    expect(content).toMatch(/OpenTelemetry Authors/);
    for (const pkg of [
      '@opentelemetry/api',
      '@opentelemetry/core',
      '@opentelemetry/resources',
      '@opentelemetry/semantic-conventions',
      '@opentelemetry/sdk-trace-web',
      '@opentelemetry/context-zone',
    ]) {
      expect(content).toContain(pkg);
    }
  });

  it('embeds the full Apache License 2.0 text', () => {
    expect(content).toMatch(/Apache License\s+Version 2\.0/);
    expect(content).toMatch(/END OF TERMS AND CONDITIONS/);
  });

  for (const pkg of PACKAGES) {
    it(`is present in packages/${pkg}/`, () => {
      expect(existsSync(join(ROOT, 'packages', pkg, 'THIRD_PARTY_LICENSES'))).toBe(true);
    });
  }
});

const hasAllDist = PACKAGES.every((p) =>
  existsSync(join(ROOT, 'packages', p, 'dist', 'index.mjs')),
);

function packFiles(pkg: string): string[] {
  const cwd = join(ROOT, 'packages', pkg);
  const raw = execSync('npm pack --dry-run --json', { cwd, encoding: 'utf8' });
  const parsed = JSON.parse(raw);
  const entry = Array.isArray(parsed) ? parsed[0] : parsed;
  return (entry.files ?? []).map((f: { path: string }) => f.path);
}

describe.skipIf(!hasAllDist)('THIRD_PARTY_LICENSES in npm pack output', () => {
  for (const pkg of PACKAGES) {
    it(`@edgemetrics/rum${pkg === 'core' ? '' : `-${pkg}`} ships THIRD_PARTY_LICENSES`, () => {
      const files = packFiles(pkg);
      expect(files).toContain('THIRD_PARTY_LICENSES');
    });
  }
});
