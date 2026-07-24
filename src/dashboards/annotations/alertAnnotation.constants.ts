/** Prometheus annotation query step for dashboard alert layers. */
export const ALERT_ANNOTATION_STEP = '10s';

export const ALERT_ANNOTATION_STEP_MS = 10_000;

/**
 * Grace after the last firing sample when asking "was it still firing at t?".
 * Covers a missed scrape; must stay on annotation-step scale, not check frequency.
 */
export const ALERT_EPISODE_END_TOLERANCE_MS = ALERT_ANNOTATION_STEP_MS * 2;
