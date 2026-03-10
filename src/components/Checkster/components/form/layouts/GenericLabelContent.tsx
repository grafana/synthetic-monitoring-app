import React, { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { LoadingPlaceholder, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { CheckFormValues, FeatureName } from 'types';
import { FeatureFlag } from 'components/FeatureFlag';

import { SectionContent } from '../../ui/SectionContent';
import { CostAttributionLabelsField } from '../generic/CostAttributionLabelsField';
import { GenericNameValueField } from '../generic/GenericNameValueField';

interface GenericLabelContentProps {
  description: string;
  isLoading?: boolean;
  calNames?: string[];
}

export function GenericLabelContent({ description, isLoading, calNames = [] }: GenericLabelContentProps) {
  const styles = useStyles2(getStyles);
  const { getValues, setValue } = useFormContext<CheckFormValues>();
  const prevCalNamesRef = useRef<string[]>([]);

  useEffect(() => {
    const prevCalNames = prevCalNamesRef.current;

    if (calNames.length === 0 && prevCalNames.length === 0) {
      return;
    }

    const hasChanged =
      calNames.length !== prevCalNames.length || calNames.some((name, i) => name !== prevCalNames[i]);

    if (!hasChanged) {
      return;
    }

    const currentLabels = getValues('labels') ?? [];
    const calNameSet = new Set(calNames);

    const staleCalNames = prevCalNames.filter((name) => !calNameSet.has(name));
    const staleCalNameSet = new Set(staleCalNames);

    const calRows = calNames.map((calName) => {
      const existing = currentLabels.find((label) => label.name === calName);
      return { name: calName, value: existing?.value ?? '' };
    });

    const remainingLabels = currentLabels.filter(
      (label) => !calNameSet.has(label.name) && !staleCalNameSet.has(label.name)
    );

    setValue('calLabels', calRows);
    setValue('labels', remainingLabels);

    prevCalNamesRef.current = calNames;
  }, [calNames, getValues, setValue]);

  if (isLoading) {
    return <LoadingPlaceholder text="Loading label limits" />;
  }

  return (
    <SectionContent>
      <div data-testid={CHECKSTER_TEST_ID.form.components.GenericLabelContent.root} className={styles.container}>
        <FeatureFlag name={FeatureName.CALs}>
          {({ isEnabled }) => (isEnabled ? <CostAttributionLabelsField calNames={calNames} /> : null)}
        </FeatureFlag>
        <GenericNameValueField
          allowEmpty
          field="labels"
          label="Custom labels"
          description={description}
          addButtonText="Label"
          interpolationVariables={{ type: 'Label' }}
          namePlaceholder="name"
          valuePlaceholder="value"
          limit={10}
          namePrefix={
            <Tooltip content="All custom labels have a 'label_' prefix to ensure they don't conflict with system-defined labels.">
              <span
                className={css`
                  padding-right: 2px;
                  &:after {
                    position: absolute;
                    content: '_';
                  }
                `}
              >
                label
              </span>
            </Tooltip>
          }
        />
      </div>
    </SectionContent>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(2)};
    `,
  };
}
