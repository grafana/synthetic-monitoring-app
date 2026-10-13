import { NavModelItem } from '@grafana/data';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

export const REF_ID_ADHOC_HISTORY_LIST = 'adhocHistoryList';
export const REF_ID_ADHOC_HISTORY_RUN = 'adhocHistoryRun';

const MILLISECONDS_IN_HOUR = 60 * 60 * 1000;

export const ADHOC_HISTORY_TIME_RANGES = [
  { label: 'Last hour', value: MILLISECONDS_IN_HOUR },
  { label: 'Last 24 hours', value: 24 * MILLISECONDS_IN_HOUR },
  { label: 'Last 7 days', value: 7 * 24 * MILLISECONDS_IN_HOUR },
  { label: 'Last 30 days', value: 30 * 24 * MILLISECONDS_IN_HOUR },
];

export const DEFAULT_ADHOC_HISTORY_TIME_RANGE = ADHOC_HISTORY_TIME_RANGES[1].value;

// Each probe publishes its result line when it finishes, so the lines of a single run are spread
// over (at most) the check timeout plus the k6 grace period. Pad the detail query window so that
// it always contains every line of the run.
export const ADHOC_RUN_WINDOW_PADDING_MS = 5 * 60 * 1000;

// Fields extracted from the result line for the list view. The heavy `logs` and `timeseries`
// fields are deliberately left out and only fetched when a run is expanded.
export const ADHOC_HISTORY_LIST_FIELDS = [
  'id',
  'target',
  'check_name',
  'job',
  'client_type',
  'success',
  'duration_seconds',
  'probes_requested',
] as const;

export const ADHOC_HISTORY_STREAM_SELECTOR = `{source="synthetic-monitoring", type="adhoc"}`;

export const ADHOC_HISTORY_PAGE_NAV: NavModelItem = {
  text: 'Test run history',
  parentItem: {
    text: 'Synthetics',
    url: generateRoutePath(AppRoutes.Home),
  },
};
