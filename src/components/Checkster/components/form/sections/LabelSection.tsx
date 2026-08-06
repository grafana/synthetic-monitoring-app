import React from 'react';
import { Stack } from '@grafana/ui';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { FormSectionName } from '../../../types';
import { LimitsFetchWarning } from 'components/LabelField';

import { SectionContent } from '../../ui/SectionContent';
import { FormSection } from '../FormSection';
import { CostAttributionLabelsField } from '../generic/CostAttributionLabelsField';
import { GenericLabelContent } from '../layouts/GenericLabelContent';
import { useLabelSectionData } from './LabelSection.hooks';
export const LABEL_SECTION_FIELDS = ['labels'];

export function LabelSection() {
  const { error, isRefetching, refetch, isLoading, customLabelLimit, description } = useLabelSectionData();

  return (
    <FormSection sectionName={FormSectionName.Labels} fields={LABEL_SECTION_FIELDS}>
      {error && (
        <div>
          <LimitsFetchWarning refetch={refetch} isRefetching={isRefetching} error={error} />
        </div>
      )}

      <SectionContent>
        <Stack direction="column" gap={2} data-testid={CHECKSTER_TEST_ID.form.components.GenericLabelContent.root}>
          <CostAttributionLabelsField />
          <GenericLabelContent description={description} isLoading={isLoading} labelLimit={customLabelLimit} />
        </Stack>
      </SectionContent>
    </FormSection>
  );
}
