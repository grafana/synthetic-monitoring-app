import {
  AdHocCheckState,
  LogEntry,
  ProbeStateStatus,
} from 'components/Checkster/feature/adhoc-check/types.adhoc-check';

import { getAdhocFailureEvidence } from './adhocFailureEvidence';

type Probe = AdHocCheckState['probeState'][string];

const success = [{ name: 'probe_success', help: '', type: 1, metric: [{ gauge: { value: 1 } }] }];
const failure = [{ name: 'probe_success', help: '', type: 1, metric: [{ gauge: { value: 0 } }] }];

function probe(overrides: Partial<Probe> & Pick<Probe, 'name'>): Probe {
  return { id: 1, public: true, logs: [], timeseries: failure, state: ProbeStateStatus.Success, ...overrides };
}

function run(...probes: Probe[]): AdHocCheckState {
  return {
    id: 'run-1',
    created: {} as AdHocCheckState['created'],
    checkTimeoutInSeconds: 30,
    probeState: Object.fromEntries(probes.map((item) => [item.name, item])),
  };
}

it('is undefined while any probe is pending', () => {
  expect(getAdhocFailureEvidence(run(probe({ name: 'a', state: ProbeStateStatus.Pending })))).toBeUndefined();
});

it('is undefined when every probe succeeded', () => {
  expect(getAdhocFailureEvidence(run(probe({ name: 'a', timeseries: success })))).toBeUndefined();
});

it('lists only the failing probes, with root causes ahead of consequences', () => {
  const evidence = getAdhocFailureEvidence(
    run(
      probe({ name: 'ok', timeseries: success, logs: [{ level: 'error', msg: 'ignored', time: '' }] }),
      probe({
        name: 'bad',
        logs: [
          { level: 'info', msg: 'Beginning check', time: '0' },
          { level: 'error', msg: 'browser-ai: assertion not met: the dashboard is showing', time: '1' },
          { level: 'info', msg: 'check result', check: 'status is 200', value: '0', time: '2' } as LogEntry,
        ],
      })
    )
  );

  expect(evidence?.failingProbes).toEqual(['bad']);
  expect(evidence?.lines).toEqual([
    { text: 'Failed assertion: "status is 200"', severity: 'context' },
    { text: 'error: browser-ai: assertion not met: the dashboard is showing', severity: 'critical' },
    { text: 'info: Beginning check', severity: 'context' },
  ]);
});

it('treats a timed out probe as failing and explains it', () => {
  const evidence = getAdhocFailureEvidence(
    run(probe({ name: 'slow', state: ProbeStateStatus.Timeout, timeseries: [] }))
  );
  expect(evidence?.failingProbes).toEqual(['slow']);
  expect(evidence?.lines[0]).toMatchObject({ severity: 'critical' });
});

it('promotes a failed assertion when it is the only evidence, and drops passing ones', () => {
  const evidence = getAdhocFailureEvidence(
    run(
      probe({
        name: 'bad',
        logs: [
          { level: 'info', msg: 'check result', check: 'passes', value: '1', time: '1' } as LogEntry,
          { level: 'info', msg: 'check result', check: 'status is 200', value: '0', time: '2' } as LogEntry,
        ],
      })
    )
  );
  expect(evidence?.lines).toEqual([{ text: 'Failed assertion: "status is 200"', severity: 'critical' }]);
});

it('demotes a generic wrapper when a specific critical line exists', () => {
  const evidence = getAdhocFailureEvidence(
    run(
      probe({
        name: 'bad',
        logs: [
          { level: 'error', msg: 'dial tcp: i/o timeout', time: '1' },
          { level: 'error', msg: 'Check failed', time: '2' },
        ],
      })
    )
  );
  expect(evidence?.lines).toEqual([
    { text: 'error: Check failed', severity: 'context' },
    { text: 'error: dial tcp: i/o timeout', severity: 'critical' },
  ]);
});

it('keeps every critical line when the cap is hit', () => {
  const logs = Array.from({ length: 8 }, (_, index) => ({ level: 'info', msg: `step ${index}`, time: `${index}` }));
  const evidence = getAdhocFailureEvidence(
    run(probe({ name: 'bad', logs: [{ level: 'error', msg: 'real cause', time: '-1' }, ...logs] }))
  );
  expect(evidence?.lines).toHaveLength(5);
  expect(evidence?.lines.map((line) => line.text)).toContain('error: real cause');
});

it('does not treat a numeric passing check value as a failure', () => {
  const evidence = getAdhocFailureEvidence(
    run(
      probe({
        name: 'bad',
        logs: [
          { level: 'info', msg: 'check result', check: 'passes', value: 1, time: '1' },
          { level: 'error', msg: 'real cause', time: '2' },
        ] as unknown as LogEntry[],
      })
    )
  );
  expect(evidence?.lines).toEqual([{ text: 'error: real cause', severity: 'critical' }]);
});
