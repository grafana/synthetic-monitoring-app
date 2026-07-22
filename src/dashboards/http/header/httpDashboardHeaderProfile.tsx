import { CheckDashboardHeaderProfile } from 'dashboards/components/CheckDashboardHeader';

import { HTTPCheck } from 'types';

import { formatHttpCheckDefinition } from './httpCheckDefinition';
import { getHttpHeaderMetrics } from './httpHeaderMetrics';
import { HttpHealthNarrative } from './HttpHealthNarrative';
import { HttpReachabilityDetails } from './HttpReachabilityDetails';

export const httpDashboardHeaderProfile: CheckDashboardHeaderProfile<HTTPCheck> = {
  getDefinition: formatHttpCheckDefinition,
  getMetrics: (check) =>
    getHttpHeaderMetrics(check).map((metric) =>
      metric.id === 'reachability' ? { ...metric, Details: HttpReachabilityDetails } : metric
    ),
  Narrative: HttpHealthNarrative,
};
