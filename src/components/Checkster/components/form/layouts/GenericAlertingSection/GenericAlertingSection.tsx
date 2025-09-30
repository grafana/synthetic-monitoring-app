import React from 'react';
import { Stack } from '@grafana/ui';

import { Feedback } from '../../../../../Feedback';
import { FIELD_SPACING } from '../../../../constants';
import { FormTabContent, FormTabs } from '../../FormTabs';
import { GenericAlertingField } from '../../generic/GenericAlertingField';
import { GenericLegacyAlertingField } from '../../generic/GenericLegacyAlertingField';

export function GenericAlertingSection() {
  return (
    <>
      <h2>Alerting</h2>
      <Stack direction="column" gap={FIELD_SPACING}>
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
            <GenericAlertingField />
          </FormTabContent>
          <FormTabContent label="Legacy alerts">
            <GenericLegacyAlertingField />
          </FormTabContent>
        </FormTabs>
      </Stack>
    </>
  );
}
