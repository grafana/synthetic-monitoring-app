import React from 'react';
import { HTTPDashboard } from 'dashboards/http/HTTPDashboard';

import { Check, FeatureName } from 'types';
import { isHttpCheck } from 'utils.types';
import { FeatureFlag } from 'components/FeatureFlag';
import { HttpDashboard } from 'scenes/HTTP/HttpDashboard';

export function HttpDashboardRoute({ check }: { check: Check }) {
  if (!isHttpCheck(check)) {
    return null;
  }

  return (
    <FeatureFlag name={FeatureName.SceneFreeHttpDashboard}>
      {({ isEnabled }) => (isEnabled ? <HTTPDashboard check={check} /> : <HttpDashboard check={check} />)}
    </FeatureFlag>
  );
}
