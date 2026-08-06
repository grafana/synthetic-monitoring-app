import React from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { FieldValidationMessage, LoadingPlaceholder, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { CheckFormValues } from 'types';

import { SectionContent } from '../../ui/SectionContent';
import { GenericNameValueField } from '../generic/GenericNameValueField';

interface GenericLabelContentProps {
  description: string;
  isLoading?: boolean;
  labelLimit?: number;
}

export function GenericLabelContent({ description, isLoading, labelLimit }: GenericLabelContentProps) {
  const styles = useStyles2(getStyles);
  const {
    formState: { errors },
  } = useFormContext<CheckFormValues>();

  if (isLoading) {
    return <LoadingPlaceholder text="Loading label limits" />;
  }

  return (
    <SectionContent>
      <div data-testid={CHECKSTER_TEST_ID.form.components.GenericLabelContent.root} className={styles.container}>
        <GenericNameValueField
          allowEmpty
          field="labels"
          label="Custom labels"
          description={description}
          addButtonText="Label"
          interpolationVariables={{ type: 'Label' }}
          namePlaceholder="name"
          valuePlaceholder="value"
          limit={labelLimit}
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
        {errors.labels?.root?.message && <FieldValidationMessage>{errors.labels.root.message}</FieldValidationMessage>}
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
