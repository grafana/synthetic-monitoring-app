import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface ProbeManifest {
  executions: number;
}

export interface ScenarioManifest {
  scenario: string;
  job: string;
  target: string;
  frequency_ms: number;
  probes: Record<string, ProbeManifest>;
  aggregate: {
    executions: number;
    reachability: number;
    uptime: number;
  };
}

const manifestPath = resolve(process.env.DEM_SCENARIO_MANIFEST ?? 'artifacts/dem-dev/scenario.json');

export function readScenarioManifest(): ScenarioManifest {
  let parsed: unknown;

  try {
    parsed = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read the dem-dev scenario manifest at ${manifestPath}`, { cause: error });
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('job' in parsed) ||
    typeof parsed.job !== 'string' ||
    !('target' in parsed) ||
    typeof parsed.target !== 'string' ||
    !('frequency_ms' in parsed) ||
    typeof parsed.frequency_ms !== 'number' ||
    !('probes' in parsed) ||
    typeof parsed.probes !== 'object' ||
    parsed.probes === null
  ) {
    throw new Error(`The dem-dev scenario manifest at ${manifestPath} does not match the expected contract`);
  }

  return parsed as ScenarioManifest;
}
