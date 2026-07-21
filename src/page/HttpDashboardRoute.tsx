import React from 'react';

import { Check } from 'types';
import { HttpDashboard } from 'scenes/HTTP/HttpDashboard';

export function HttpDashboardRoute({ check }: { check: Check }) {
  return <HttpDashboard check={check} />;
}
