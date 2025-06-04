import React, { useState } from 'react';
import { Stack, Tab, TabContent, TabsBar } from '@grafana/ui';

import { AlertingType } from 'types';
import { AlertsPerCheck } from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck';
import { CheckFormAlert } from 'components/CheckFormAlert';

export const AlertsPerCheckSection: React.FC = () => {
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
        {selectedAlertingTab === 'alerting' && <AlertsPerCheck />}
        {selectedAlertingTab === 'sensitivity' && <CheckFormAlert />}
      </TabContent>
    </Stack>
  );
};
