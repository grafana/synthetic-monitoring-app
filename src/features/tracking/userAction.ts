import { faro } from '@grafana/faro-web-sdk';

import { FaroUserAction } from '../../faro';

// Prefer calling this directly in the handler over the `data-faro-user-action-name` attribute:
// shared components (e.g. a submit button used for both create and edit) often can't tell which
// action fired from a static attribute alone, so the manual API keeps naming correct everywhere.
export function trackFaroUserAction(name: FaroUserAction, attributes?: Record<string, string>) {
  try {
    faro.api.startUserAction(name, attributes);
  } catch (e) {
    // todo: report an error?
  }
}
