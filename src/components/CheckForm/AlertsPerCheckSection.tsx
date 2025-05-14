import React, { useState } from 'react';
import { Stack, Tab, TabContent, TabsBar } from '@grafana/ui';

import { AlertingType, CheckAlertFormValues, CheckAlertType } from 'types';
import { AlertsPerCheck } from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck';
import { CheckFormAlert } from 'components/CheckFormAlert';

interface AlertsPerCheckSectionProps {
  handleInitAlerts: (alerts: Partial<Record<CheckAlertType, CheckAlertFormValues>>) => void;
  alertsInitialized: boolean;
}

export const AlertsPerCheckSection: React.FC<AlertsPerCheckSectionProps> = ({
  handleInitAlerts,
  alertsInitialized,
}) => {
  const [selectedAlertingTab, setSelectedAlertingTab] = useState<AlertingType>('alerting');

  return (
    <Stack direction="column" gap={2}>
      <TabsBar>
        <Tab
          label="Per-check alerts"
          onChangeTab={() => setSelectedAlertingTab('alerting')}
          active={selectedAlertingTab === 'alerting'}
        />
        <Tab
          label="Legacy alerts"
          onChangeTab={() => setSelectedAlertingTab('sensitivity')}
          active={selectedAlertingTab === 'sensitivity'}
        />
      </TabsBar>
      <TabContent>
        {selectedAlertingTab === 'alerting' && (
          <AlertsPerCheck onInitAlerts={handleInitAlerts} isInitialized={alertsInitialized} />
        )}
        {selectedAlertingTab === 'sensitivity' && <CheckFormAlert />}
      </TabContent>
    </Stack>
  );
};
