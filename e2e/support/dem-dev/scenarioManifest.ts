import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface ProbeManifest {
  executions: number;
  reachability: number;
  status_counts: Record<string, number>;
}

interface AlertTransitionManifest {
  state: string;
  at: string;
}

interface AlertManifest {
  name: string;
  threshold: number;
  period: string;
  ever_fires: boolean;
  transitions: AlertTransitionManifest[];
}

export interface ScenarioManifest {
  scenario: string;
  generator_version: number;
  seed: number;
  start: string;
  end: string;
  job: string;
  target: string;
  frequency_ms: number;
  probes: Record<string, ProbeManifest>;
  aggregate: {
    executions: number;
    reachability: number;
    uptime: number;
  };
  alerts: AlertManifest[];
}

const manifestPath = resolve(
  process.env.DEM_SCENARIO_HISTORY_MANIFEST ?? process.env.DEM_SCENARIO_MANIFEST ?? 'artifacts/dem-dev/scenario.json'
);

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
    !('scenario' in parsed) ||
    typeof parsed.scenario !== 'string' ||
    !('generator_version' in parsed) ||
    typeof parsed.generator_version !== 'number' ||
    !('seed' in parsed) ||
    typeof parsed.seed !== 'number' ||
    !('start' in parsed) ||
    typeof parsed.start !== 'string' ||
    !('end' in parsed) ||
    typeof parsed.end !== 'string' ||
    !('job' in parsed) ||
    typeof parsed.job !== 'string' ||
    !('target' in parsed) ||
    typeof parsed.target !== 'string' ||
    !('frequency_ms' in parsed) ||
    typeof parsed.frequency_ms !== 'number' ||
    !('probes' in parsed) ||
    typeof parsed.probes !== 'object' ||
    parsed.probes === null ||
    !('aggregate' in parsed) ||
    typeof parsed.aggregate !== 'object' ||
    parsed.aggregate === null ||
    !('alerts' in parsed) ||
    !Array.isArray(parsed.alerts)
  ) {
    throw new Error(`The dem-dev scenario manifest at ${manifestPath} does not match the expected contract`);
  }

  return parsed as ScenarioManifest;
}
