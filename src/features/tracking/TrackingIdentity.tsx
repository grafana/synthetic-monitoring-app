import { useEffect } from 'react';
import { setTrackingBaseProps } from 'features/tracking/utils';

import { useTenant } from 'data/useTenant';

/**
 * Registers the Grafana Cloud org identity from the SM tenant as base properties on all
 * tracking events. The property is named `org_id` (rather than camelCase) because downstream
 * BigQuery consumers key off that exact column name. Renders nothing.
 *
 * Note this is the grafana.com org id, NOT the instance-internal org id from
 * `config.bootData.user.orgId` (which is always 1 on cloud stacks).
 */
export const TrackingIdentity = () => {
  const { data: tenant } = useTenant();

  useEffect(() => {
    if (typeof tenant?.orgId === 'number' && Number.isFinite(tenant.orgId)) {
      setTrackingBaseProps({ org_id: tenant.orgId });
    }
  }, [tenant]);

  return null;
};
