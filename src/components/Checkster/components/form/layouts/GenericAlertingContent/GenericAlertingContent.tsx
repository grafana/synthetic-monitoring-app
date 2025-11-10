import React from 'react';

import { FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useLegacyAlertsRestriction } from 'hooks/useLegacyAlertsRestriction';
import { Feedback } from 'components/Feedback';

import { CenteredSpinner } from '../../../../../CenteredSpinner';
import { SectionContent } from '../../../ui/SectionContent';
import { FormTabContent, FormTabs } from '../../FormTabs';
import { GenericAlertingField } from '../../generic/GenericAlertingField';
import { GenericLegacyAlertingField } from '../../generic/GenericLegacyAlertingField';

export function GenericAlertingContent() {
  const { isRestricted, isLoading } = useLegacyAlertsRestriction();
  const isAlertsPerCheckOn = useFeatureFlag(FeatureName.AlertsPerCheck).isEnabled;
  const isLegacyEnabled = !isRestricted && !isLoading;

  if (isLoading) {
    return <CenteredSpinner />;
  }

  return (
    <SectionContent>
      {/* Even if FormTabContent isn't rendered, a boolean takes up it's index, hence why legacy alerts will always be at index 1 */}
      <FormTabs activeIndex={isAlertsPerCheckOn ? undefined : 1}>
        {isAlertsPerCheckOn && (
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
                placement="top-end"
              />
            }
          >
            <GenericAlertingField field="alerts" />
          </FormTabContent>
        )}
        {isLegacyEnabled && (
          <FormTabContent label="Legacy alerts">
            <GenericLegacyAlertingField />
          </FormTabContent>
        )}
      </FormTabs>
    </SectionContent>
  );
}
