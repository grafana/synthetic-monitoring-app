import { BadgeColor, IconName } from '@grafana/ui';

import { ProbeState } from './CheckSidePanel.types';

// Constants
export const TIMEOUT_SECONDS = 10;

export const HIGHLIGHT_PATTERNS = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  '***SECRET_REDACTED***',
  '302 Found',
  '301 Moved Permanently',
  '200 OK',
];

// Utility functions
export function getProbeSuccess(timeseries: unknown): 'success' | 'error' | null {
  if (!Array.isArray(timeseries)) {
    return null;
  }

  const metric = timeseries.find((item) => item.name === 'probe_success');
  if (!metric) {
    return null;
  }
  return !!metric?.metric?.[0]?.gauge?.value ? 'success' : 'error';
}

export function getStateIcon(state: ProbeState): IconName {
  switch (state) {
    case 'pending':
      return 'fa fa-spinner';
    case 'error':
      return 'bug';
    case 'timeout':
      return 'exclamation-triangle';
    case 'success':
      return 'check-circle';
  }
}

export function getStateColorIndex(state: ProbeState): BadgeColor {
  switch (state) {
    case 'pending':
      // @ts-expect-error This is correct
      return 'darkgrey';
    case 'success':
      return 'green';
    case 'timeout':
      return 'orange';
    case 'error':
      return 'red';
  }
} 
