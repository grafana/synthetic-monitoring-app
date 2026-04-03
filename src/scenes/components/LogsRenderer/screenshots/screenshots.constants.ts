/**
 * Screenshot display contract:
 *
 * The frontend discovers screenshots via two log lines produced by the k6 script:
 *
 * 1. EXECUTION LOG (discovery): The script must call `console.log(`screenshot:${uuid}`)`.
 *    This line appears in the check's normal execution logs. The frontend scans for
 *    SCREENSHOT_PATTERN to extract UUIDs and trigger a secondary query.
 *
 * 2. SCREENSHOT LOG (payload): The script must push a JSON log line to Loki with
 *    `source: SCREENSHOT_LOG_SOURCE` and a matching `id` field. The JSON can contain
 *    either `screenshot_base64` (inline, optionally chunked) or `screenshot_url`
 *    (reference to external storage like S3/GCS). Both are supported by the frontend.
 *
 * Without both log lines, screenshots will not be detected or displayed.
 */

export const SCREENSHOT_PATTERN = /screenshot:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

export const SCREENSHOT_LOG_SOURCE = 'synthetic-monitoring-agent-screenshot';

export const SCREENSHOT_LABEL_KEYS = ['screenshot_base64', 'screenshot_url', 'caption'] as const;

export const EMPTY_UUIDS: string[] = [];
