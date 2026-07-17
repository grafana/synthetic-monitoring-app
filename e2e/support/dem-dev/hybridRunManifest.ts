import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface HybridObservation {
  at: string;
  success: boolean;
  http_status_code: number;
}

export interface HybridRunManifest {
  schema_version: 1;
  run_id: string;
  state: 'ready-for-tests';
  plan: {
    start: string;
    cutover: string;
    end: string;
  };
  binding: {
    check_id: number;
    job: string;
    target: string;
    frequency_ns: number;
    probe_ids: Record<string, number>;
  };
  history: {
    executions: number;
    verified_metrics: number;
    verified_logs: number;
  };
  phases: Array<{
    name: string;
    observation?: HybridObservation;
  }>;
}

const manifestPath = resolve(process.env.DEM_SCENARIO_MANIFEST ?? 'artifacts/dem-dev/scenario.json');

export function readHybridRunManifest(): HybridRunManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read the dem-dev hybrid run manifest at ${manifestPath}`, { cause: error });
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('schema_version' in parsed) ||
    parsed.schema_version !== 1 ||
    !('state' in parsed) ||
    parsed.state !== 'ready-for-tests' ||
    !('binding' in parsed) ||
    typeof parsed.binding !== 'object' ||
    parsed.binding === null ||
    !('check_id' in parsed.binding) ||
    typeof parsed.binding.check_id !== 'number' ||
    !('plan' in parsed) ||
    typeof parsed.plan !== 'object' ||
    parsed.plan === null ||
    !('phases' in parsed) ||
    !Array.isArray(parsed.phases)
  ) {
    throw new Error(`The dem-dev hybrid run manifest at ${manifestPath} does not match the expected ready contract`);
  }

  return parsed as HybridRunManifest;
}
