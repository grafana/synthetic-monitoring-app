export const DISMISSED_FINDINGS_STORAGE_KEY = 'grafana.sm.recommendations.dismissedFindings';

/** Per-check dismissals, keyed by finding id, so hiding one row does not hide the finding. */
export const DISMISSED_CHECKS_STORAGE_KEY = 'grafana.sm.recommendations.dismissedChecks';

/**
 * Rows shown per page inside a finding. One category is shown at a time, so this only has to
 * keep a genuinely large fleet in check rather than split a nine-row finding in two.
 */
export const ROWS_PER_PAGE = 25;

/** Concurrent requests when applying an action across several checks; the SM API is a single replica. */
export const BULK_ACTION_BATCH_SIZE = 5;

/** The `?category=` and `?finding=` search params that drive which view the tab shows. */
export const CATEGORY_PARAM = 'category';
export const FOCUS_PARAM = 'finding';
