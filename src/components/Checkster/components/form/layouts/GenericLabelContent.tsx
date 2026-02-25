import React, { useEffect, useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { LoadingPlaceholder, Tooltip } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { CheckFormValues } from 'types';

import { SectionContent } from '../../ui/SectionContent';
import { GenericNameValueField } from '../generic/GenericNameValueField';

interface GenericLabelContentProps {
  description: string;
  isLoading?: boolean;
  calNames?: string[];
}

export function GenericLabelContent({ description, isLoading, calNames = [] }: GenericLabelContentProps) {
  const { getValues, setValue } = useFormContext<CheckFormValues>();
  const prevCalNamesRef = useRef<string[]>([]);
  const lockedNames = useMemo(() => new Set(calNames), [calNames]);

  useEffect(() => {
    const prevCalNames = prevCalNamesRef.current;

    if (calNames.length === 0 && prevCalNames.length === 0) {
      return;
    }

    const currentLabels = getValues('labels') ?? [];
    const calNameSet = new Set(calNames);

    const staleCalNames = prevCalNames.filter((name) => !calNameSet.has(name));
    const staleCalNameSet = new Set(staleCalNames);
    const userLabels = currentLabels.filter((label) => !calNameSet.has(label.name) && !staleCalNameSet.has(label.name));

    const calRows = calNames.map((calName) => {
      const existing = currentLabels.find((label) => label.name === calName);
      return { name: calName, value: existing?.value ?? '', type: 'cost-attribution' as const };
    });

    if (calNames.length !== prevCalNames.length ||
      calNames.some((name, i) => name !== prevCalNames[i])) {
      setValue('labels', [...calRows, ...userLabels]);
    }

    prevCalNamesRef.current = calNames;
  }, [calNames, getValues, setValue]);

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
          lockedNames={lockedNames}
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
