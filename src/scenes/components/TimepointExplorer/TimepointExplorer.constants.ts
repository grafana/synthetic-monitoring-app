export const TIMEPOINT_SIZE = 20;
export const TIMEPOINT_GAP = 1;
export const THEME_UNIT = 8;
export const TIMEPOINT_GAP_PX = TIMEPOINT_GAP * THEME_UNIT;
export const TIMEPOINT_THEME_HEIGHT = 60;
export const TIMEPOINT_THEME_HEIGHT_PX = TIMEPOINT_THEME_HEIGHT * THEME_UNIT;

export const TIMEPOINT_LIST_ID = `timepoint-list`;
export const TIMEPOINT_LIST_ANNOTATIONS_ID = `timepoint-list-annotations`;

export const REF_ID_UNIQUE_CHECK_CONFIGS = `uniqueCheckConfigs`;
export const REF_ID_EXECUTION_LIST_LOGS = `executionListLogs`;
export const REF_ID_EXECUTION_VIEWER_LOGS = `executionViewerLogs`;
export const REF_ID_MAX_PROBE_DURATION = `maxProbeDuration`;

export const MAX_PROBE_DURATION_DEFAULT = 1000;

export const TIMEPOINT_EXPLORER_VIEW_OPTIONS = [
  { label: 'Uptime', value: 'uptime' },
  { label: 'Reachability', value: 'reachability' },
];

export const MAX_MINIMAP_SECTIONS = 6;

const success = `success` as const;
const failure = `failure` as const;
const unknown = `unknown` as const;
const pending = `pending` as const;

export const VIZ_DISPLAY_OPTIONS = [success, failure, unknown, pending];
