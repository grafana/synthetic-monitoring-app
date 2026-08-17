import { BusEventWithPayload } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';

import type { CheckType } from 'types';

class SyntheticMonitoringCheckCreatedEvent extends BusEventWithPayload<{ checkType: CheckType; }> {
  static type = 'synthetic-monitoring/check-created';
}

export const emitCheckCreatedEvent = ({ checkType }: { checkType: CheckType }) => {
  getAppEvents().publish(new SyntheticMonitoringCheckCreatedEvent({ checkType }));
}
