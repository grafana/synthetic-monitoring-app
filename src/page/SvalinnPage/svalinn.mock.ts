import type { StatCard, TestEntry } from './svalinn.types';

export const MOCK_STAT_CARDS: StatCard[] = [
  { label: 'Suggestions', value: 3, detail: 'pending review', status: 'warning' },
  { label: 'Active Tests', value: 5, detail: 'running', status: 'success' },
  { label: 'Incidents Covered', value: 12, detail: 'protected by automated tests', status: 'info' },
];

export const MOCK_TEST_ENTRIES: TestEntry[] = [
  {
    status: 'pass',
    name: 'Cart service can sustain 200k req/s',
    type: 'performance',
    product: 'k6',
    linkedIncident: 'Black Friday Perf Degradation',
    lastRun: '2m ago',
    incidentsCovered: 3,
  },
  {
    status: 'pass',
    name: 'Login button is responsive',
    type: 'availability',
    product: 'synthetics',
    linkedIncident: null,
    lastRun: '5m ago',
    incidentsCovered: 2,
  },
  {
    status: 'pass',
    name: 'Payment Service accessible from Singapore',
    type: 'availability',
    product: 'synthetics',
    linkedIncident: 'AWS ME-South-1 Down',
    lastRun: '5m ago',
    incidentsCovered: 4,
  },
  {
    status: 'pass',
    name: 'TLS handshake takes less than 500ms',
    type: 'latency',
    product: 'synthetics',
    linkedIncident: null,
    lastRun: '12m ago',
    incidentsCovered: 1,
  },
  {
    status: 'warn',
    name: 'AI service falls back to Claude',
    type: 'fallback',
    product: 'k6',
    linkedIncident: 'Claude API Outage',
    lastRun: '1m ago',
    incidentsCovered: 2,
  },
];
