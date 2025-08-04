import { FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';

export const FORM_MAX_WIDTH = `860px`;

export type SectionName = (typeof FORM_SECTION_STEPS)[number];

const isAlertsPerCheckEnabled = isFeatureEnabled(FeatureName.AlertsPerCheck);
export const FORM_SECTION_STEPS = isAlertsPerCheckEnabled
  ? ['job', 'uptime', 'labels', 'execution', 'alerting']
  : ['job', 'uptime', 'labels', 'alerting', 'execution'];
