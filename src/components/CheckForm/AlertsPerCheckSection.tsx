import React, { useState } from 'react';
import { Tab, TabContent, TabsBar } from '@grafana/ui';

import { AlertingType, CheckAlertFormValues, CheckAlertType } from 'types';
import { AlertsPerCheck } from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck';
import { CheckFormAlert } from 'components/CheckFormAlert';

interface AlertsPerCheckSectionProps {
  handleInitAlerts: (alerts: Partial<Record<CheckAlertType, CheckAlertFormValues>>) => void;
  alertsInitialized: boolean;
  styles: { wrapper: string };
}

export const AlertsPerCheckSection: React.FC<AlertsPerCheckSectionProps> = ({
  handleInitAlerts,
  alertsInitialized,
  styles,
}) => {
  const [selectedAlertingTab, setSelectedAlertingTab] = useState<AlertingType>('alerting');

  return (
    <>
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
        <div className={styles.wrapper}>
          {selectedAlertingTab === 'alerting' && (
            <AlertsPerCheck onInitAlerts={handleInitAlerts} isInitialized={alertsInitialized} />
          )}
          {selectedAlertingTab === 'sensitivity' && <CheckFormAlert />}
        </div>
      </TabContent>
    </>
  );
}; 
