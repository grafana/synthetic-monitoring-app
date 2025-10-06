import React from 'react';

import { Feedback } from 'components/Feedback';

import { SectionContent } from '../../../ui/SectionContent';
import { FormTabContent, FormTabs } from '../../FormTabs';
import { GenericAlertingField } from '../../generic/GenericAlertingField';
import { GenericLegacyAlertingField } from '../../generic/GenericLegacyAlertingField';

export function GenericAlertingContent() {
  return (
    <SectionContent>
      <FormTabs>
        <FormTabContent
          label="Per-check alerts"
          actions={
            <Feedback
              about={{
                text: 'New!',
                link: 'https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/configure-alerts/configure-per-check-alerts/',
                tooltipText: 'Read more about per-check alerts',
              }}
              feature="alerts_per_check"
            />
          }
        >
          <GenericAlertingField field="alerts" />
        </FormTabContent>
        <FormTabContent label="Legacy alerts">
          <GenericLegacyAlertingField />
        </FormTabContent>
      </FormTabs>
    </SectionContent>
  );
}
