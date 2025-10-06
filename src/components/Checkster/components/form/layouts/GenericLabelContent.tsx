import React from 'react';
import { Tooltip } from '@grafana/ui';
import { css } from '@emotion/css';

import { SectionContent } from '../../ui/SectionContent';
import { GenericNameValueField } from '../generic/GenericNameValueField';

export function GenericLabelContent() {
  return (
    <SectionContent>
      <GenericNameValueField
        allowEmpty
        field="labels"
        label="Custom labels"
        description="FIX ME: Custom labels to be included with collected metrics and logs. You can add up to 10. If you add more than 5 labels, they will potentially not be used to index logs, and rather added as part of the log message."
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
    </SectionContent>
  );
}
