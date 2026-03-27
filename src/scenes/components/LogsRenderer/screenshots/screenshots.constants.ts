export const SCREENSHOT_PATTERN = /screenshot:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

export const SCREENSHOT_LOG_SOURCE = 'synthetic-monitoring-agent-screenshot';

export const SCREENSHOT_LABEL_KEYS = ['screenshot_base64', 'screenshot_url', 'caption'] as const;

export const EMPTY_UUIDS: string[] = [];
