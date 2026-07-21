import React from 'react';
import { SceneFreeHttpDashboard } from 'dashboards/http/SceneFreeHttpDashboard';

import { Check, FeatureName } from 'types';
import { FeatureFlag } from 'components/FeatureFlag';
import { HttpDashboard } from 'scenes/HTTP/HttpDashboard';

export function HttpDashboardRoute({ check }: { check: Check }) {
  return (
    <FeatureFlag name={FeatureName.SceneFreeHttpDashboard}>
      {({ isEnabled }) => (isEnabled ? <SceneFreeHttpDashboard check={check} /> : <HttpDashboard check={check} />)}
    </FeatureFlag>
  );
}
