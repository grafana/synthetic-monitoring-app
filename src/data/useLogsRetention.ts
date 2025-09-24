import { config } from '@grafana/runtime';

import { UnixTimestamp } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

const FREE_TRIAL_RETENTION_DAYS = 14;
const STANDARD_RETENTION_DAYS = 31;

// todo: this is a temporary solution to get the logs retention period.
// really we should get this from gcom or another endpoint
// some clients will have custom retention periods which makes this unreliable
export function useLogsRetentionPeriod(from: UnixTimestamp) {
  // @ts-expect-error - Cloud Free is not defined in the config but it is what is present for Free trial accounts and free tier accounts
  const isFree = config.buildInfo.edition === `Cloud Free`;
  const days = isFree ? FREE_TRIAL_RETENTION_DAYS : STANDARD_RETENTION_DAYS;

  const HOURS_IN_DAY = 24;
  const MINUTES_IN_HOUR = 60;
  const SECONDS_IN_MINUTE = 60;
  const MILLISECONDS_IN_SECOND = 1000;

  return days * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND;
}
