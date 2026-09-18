import { hasGlobalPermission } from 'utils';
import { useTenantCostAttributionLabels } from 'data/useTenantCostAttributionLabels';

import { CMAB_COST_ATTRIBUTION_WRITE } from './CostAttribution.constants';

export function useShowCostAttributionSetupNudge() {
  const { data } = useTenantCostAttributionLabels();

  // Setting up CALs happens in the CMAB app and needs cost attribution write permission, so only
  // nudge people who can act. Requiring resolved data also covers a failed fetch and a disabled
  // feature flag (which leaves the query disabled), neither of which must imply "this tenant has
  // no CALs".
  return hasGlobalPermission(CMAB_COST_ATTRIBUTION_WRITE) && data?.names.length === 0;
}
