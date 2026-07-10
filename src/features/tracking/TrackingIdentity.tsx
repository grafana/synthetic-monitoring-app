import { useEffect } from 'react';
import { setTrackingBaseProps } from 'features/tracking/utils';

import { useTenant } from 'data/useTenant';

/**
 * Registers the Grafana Cloud identity from the SM tenant as base properties on all
 * tracking events. The properties are named `org_id`/`stack_id` (rather than camelCase)
 * because downstream BigQuery consumers key off those exact column names. Renders nothing.
 *
 * Note these are the grafana.com org and stack ids, NOT the instance-internal org id from
 * `config.bootData.user.orgId` (which is always 1 on cloud stacks).
 */
export const TrackingIdentity = () => {
  const { data: tenant } = useTenant();

  useEffect(() => {
    if (tenant) {
      // setTrackingBaseProps drops undefined values, so an invalid field is omitted rather than reported
      setTrackingBaseProps({
        org_id: Number.isFinite(tenant.orgId) ? tenant.orgId : undefined,
        stack_id: Number.isFinite(tenant.stackId) ? tenant.stackId : undefined,
      });
    }
  }, [tenant]);

  return null;
};
