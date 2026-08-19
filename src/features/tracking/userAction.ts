import { faro } from '@grafana/faro-web-sdk';

import { FaroUserAction } from '../../faro';

export function trackFaroUserAction(name: FaroUserAction, attributes?: Record<string, string>) {
  try {
    faro.api.startUserAction(name, attributes);
  } catch (e) {
    // todo: report an error?
  }
}
