export const DISMISSED_FINDINGS_STORAGE_KEY = 'grafana.sm.recommendations.dismissedFindings';

export const DISMISSED_CHECKS_STORAGE_KEY = 'grafana.sm.recommendations.dismissedChecks';

export const ROWS_PER_PAGE = 25;

// The SM API is a single replica.
export const BULK_ACTION_BATCH_SIZE = 5;

// `t` HTML-escapes interpolated values and React escapes them again, so a check named
// `https://a.com/` would read `https:&#x2F;&#x2F;a.com&#x2F;`. Spread wherever user content is interpolated.
export const UNESCAPED = { interpolation: { escapeValue: false } };

export const CATEGORY_PARAM = 'category';
export const FOCUS_PARAM = 'finding';
