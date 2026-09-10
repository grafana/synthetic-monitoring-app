export const DISMISSED_FINDINGS_STORAGE_KEY = 'grafana.sm.recommendations.dismissedFindings';

/** Rows shown per page inside a finding. */
export const ROWS_PER_PAGE = 7;

/** Concurrent requests when applying an action across a whole finding; the SM API is a single replica. */
export const BULK_ACTION_BATCH_SIZE = 5;
