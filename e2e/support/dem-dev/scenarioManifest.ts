import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface AlertTransition {
  state: 'pending' | 'firing' | 'resolved';
  at: string;
}

export interface ProbeManifest {
  executions: number;
  offset_s: number;
  status_counts: Record<string, number>;
  reachability: number;
  latency_p50_ms: number;
  latency_p95_ms: number;
}

export interface ScenarioManifest {
  schema_version?: number;
  scenario: string;
  dsl_version?: number;
  job: string;
  target: string;
  start?: string;
  end?: string;
  frequency_ms: number;
  probes: Record<string, ProbeManifest>;
  aggregate: {
    executions: number;
    reachability: number;
    uptime: number;
    latency_mean_ms?: number;
    ssl_earliest_cert_expiry?: number;
  };
  alerts?: Array<{ name: string; transitions: AlertTransition[] }>;
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
