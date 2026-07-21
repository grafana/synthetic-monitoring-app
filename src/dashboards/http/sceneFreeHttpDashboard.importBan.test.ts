import fs from 'fs';
import path from 'path';

const ENTRY = path.join(__dirname, 'SceneFreeHttpDashboard.tsx');
const SRC_ROOT = path.join(__dirname, '../..');
const SCENE_PACKAGES = ['@grafana/scenes', '@grafana/scenes-react'];
const MONITORED_PREFIXES = ['dashboards/', 'scenes/components/TimepointExplorer/'];
const ALLOWLIST = new Set<string>();

function resolveImport(fromFile: string, importPath: string): string | null {
  if (SCENE_PACKAGES.some((pkg) => importPath === pkg || importPath.startsWith(`${pkg}/`))) {
    return importPath;
  }

  if (
    !importPath.startsWith('.') &&
    !importPath.startsWith('dashboards/') &&
    !importPath.startsWith('contexts/') &&
    !importPath.startsWith('scenes/') &&
    !importPath.startsWith('components/') &&
    !importPath.startsWith('hooks/') &&
    !importPath.startsWith('types') &&
    !importPath.startsWith('data/') &&
    !importPath.startsWith('routing/') &&
    !importPath.startsWith('features/') &&
    !importPath.startsWith('utils/') &&
    !importPath.startsWith('queries/')
  ) {
    return null;
  }

  const candidateBase = importPath.startsWith('.')
    ? path.resolve(path.dirname(fromFile), importPath)
    : path.join(SRC_ROOT, importPath);

  const extensions = ['.tsx', '.ts', '/index.tsx', '/index.ts'];

  for (const extension of extensions) {
    const candidate = `${candidateBase}${extension}`;

    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function extractImports(filePath: string): string[] {
  const source = fs.readFileSync(filePath, 'utf8');
  const imports: string[] = [];
  const importRegex = /from ['"]([^'"]+)['"]/g;

  for (const match of source.matchAll(importRegex)) {
    imports.push(match[1]!);
  }

  return imports;
}

function isMonitoredFile(relativePath: string): boolean {
  if (ALLOWLIST.has(relativePath)) {
    return false;
  }

  if (relativePath.includes('/__tests__/') || relativePath.endsWith('.test.ts') || relativePath.endsWith('.test.tsx')) {
    return false;
  }

  return MONITORED_PREFIXES.some((prefix) => relativePath.startsWith(prefix));
}

function collectReachableFiles(entryFile: string): Array<{ file: string; importPath: string }> {
  const visited = new Set<string>();
  const violations: Array<{ file: string; importPath: string }> = [];
  const queue = [entryFile];

  while (queue.length) {
    const file = queue.pop()!;

    if (visited.has(file) || !fs.existsSync(file)) {
      continue;
    }

    visited.add(file);
    const relativePath = path.relative(SRC_ROOT, file).replace(/\\/g, '/');

    for (const importPath of extractImports(file)) {
      if (
        isMonitoredFile(relativePath) &&
        SCENE_PACKAGES.some((pkg) => importPath === pkg || importPath.startsWith(`${pkg}/`))
      ) {
        violations.push({ file: relativePath, importPath });
      }

      const resolved = resolveImport(file, importPath);

      if (resolved && path.extname(resolved)) {
        queue.push(resolved);
      }
    }
  }

  return violations;
}

describe('SceneFreeHttpDashboard import ban', () => {
  it('does not import @grafana/scenes or @grafana/scenes-react from monitored dashboard modules', () => {
    const violations = collectReachableFiles(ENTRY);

    expect(violations).toEqual([]);
  });
});
