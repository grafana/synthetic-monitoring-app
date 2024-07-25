import React, { PropsWithChildren } from 'react';

import { InstanceContext } from 'contexts/InstanceContext';
import { useSMDS } from 'hooks/useSMDS';

interface Props {
  metricInstanceName?: string;
  logsInstanceName?: string;
}

export const InstanceProvider = ({ children }: PropsWithChildren<Props>) => {
  const smDS = useSMDS();
  const instances = {
    metrics: smDS.getMetricsDS(),
    logs: smDS.getLogsDS(),
    alertRuler: undefined,
  };

  // this case should theoretically be impossible, since we are setting 'instances' to an object in the failure case
  if (!instances) {
    throw new Error('There was an error finding datasources required for Synthetic Monitoring');
  }

  return <InstanceContext.Provider value={{ instance: instances }}>{children}</InstanceContext.Provider>;
};
