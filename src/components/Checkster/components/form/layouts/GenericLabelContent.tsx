import React from 'react';
import { LoadingPlaceholder, Tooltip } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { SectionContent } from '../../ui/SectionContent';
import { GenericNameValueField } from '../generic/GenericNameValueField';

export function GenericLabelContent({ description, isLoading }: { description: string; isLoading?: boolean }) {
  if (isLoading) {
    return <LoadingPlaceholder text="Loading label limits" />;
  }

  return (
    <SectionContent>
      <div data-testid={CHECKSTER_TEST_ID.form.components.GenericLabelContent.root}>
        <GenericNameValueField
          allowEmpty
          field="labels"
          label="Custom labels"
          description={description}
          addButtonText="Label"
          interpolationVariables={{ type: 'Label' }}
          namePlaceholder="name" // Looks a bit wonky with "label_Name"
          valuePlaceholder="value" // Since we lowercase the name placeholder, do the same for value
          limit={10}
          namePrefix={
            <Tooltip content="All custom labels have a 'label_' prefix to ensure they don’t conflict with system-defined labels.">
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
