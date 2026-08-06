import React from 'react';

import { FormSectionName } from '../../../types';
import { LimitsFetchWarning } from 'components/LabelField';

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

      <CostAttributionLabelsField />
      <GenericLabelContent description={description} isLoading={isLoading} labelLimit={customLabelLimit} />
    </FormSection>
  );
}
