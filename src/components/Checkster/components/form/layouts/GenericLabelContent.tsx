import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FieldValidationMessage, LoadingPlaceholder, Tooltip } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues } from 'types';

import { GenericNameValueField } from '../generic/GenericNameValueField';

interface GenericLabelContentProps {
  description: string;
  isLoading?: boolean;
  labelLimit?: number;
}

export function GenericLabelContent({ description, isLoading, labelLimit }: GenericLabelContentProps) {
  const {
    formState: { errors },
  } = useFormContext<CheckFormValues>();

  if (isLoading) {
    return <LoadingPlaceholder text="Loading label limits" />;
  }

  return (
    <>
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
    </>
  );
}
