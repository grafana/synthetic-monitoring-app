import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { KnowledgeGraphServiceLink } from 'features/knowledgeGraph/KnowledgeGraphServiceLink';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { FormSectionName } from '../../../types';
import { useShowCostAttributionSetupNudge } from 'components/CostAttribution/CostAttribution.hooks';
import { CostAttributionSetupHint } from 'components/CostAttribution/CostAttributionSetupHint';
import { LimitsFetchWarning } from 'components/LabelField';

import { SectionContent } from '../../ui/SectionContent';
import { FormSection } from '../FormSection';
import { CostAttributionLabelsField } from '../generic/CostAttributionLabelsField';
import { GenericLabelContent } from '../layouts/GenericLabelContent';
import { useLabelSectionData } from './LabelSection.hooks';
export const LABEL_SECTION_FIELDS = ['labels'];

export function LabelSection() {
  const { error, isRefetching, refetch, isLoading, customLabelLimit, description } = useLabelSectionData();
  const showNudge = useShowCostAttributionSetupNudge();
  const styles = useStyles2(getStyles);

  return (
    <FormSection sectionName={FormSectionName.Labels} fields={LABEL_SECTION_FIELDS}>
      {error && (
        <div>
          <LimitsFetchWarning refetch={refetch} isRefetching={isRefetching} error={error} />
        </div>
      )}
      {showNudge && (
        <div className={styles.nudge}>
          <CostAttributionSetupHint />
        </div>
      )}
      <KnowledgeGraphServiceLink />
      <SectionContent>
        <Stack direction="column" gap={2} data-testid={CHECKSTER_TEST_ID.form.components.GenericLabelContent.root}>
          <CostAttributionLabelsField />
          <GenericLabelContent description={description} isLoading={isLoading} labelLimit={customLabelLimit} />
        </Stack>
      </SectionContent>
    </FormSection>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    // Matches the KnowledgeGraphServiceLink container so the hint aligns with the section content
    nudge: css`
      padding: ${theme.spacing(2, 2, 0, 2)};
    `,
  };
}
