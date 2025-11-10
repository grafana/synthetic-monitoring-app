import React, { ReactElement, useCallback, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Field, Stack, Tab, TabsBar, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { MAX_BASE_FREQUENCY } from 'schemas/general/Frequency';
import { DataTestIds } from 'test/dataTestIds';

import { FrequencyComponentProps } from './Frequency.types';
import { CheckFormValues, CheckType } from 'types';
import { useRevalidateForm } from 'hooks/useRevalidateForm';

import { FREQUENCY_INPUT_ID, FREQUENCY_OPTIONS, MIN_FREQUENCY_MAP } from './Frequency.constants';
import { FrequencyBasic } from './FrequencyBasic';
import { FrequencyCustom } from './FrequencyCustom';

interface ProbeOptionsProps {
  checkType: CheckType;
  disabled?: boolean;
}

const TAB_KEYS = ['basic', 'custom'] as const;

const TABS: Record<
  (typeof TAB_KEYS)[number],
  { label: string; component: (props: FrequencyComponentProps) => ReactElement }
> = {
  basic: {
    label: 'Basic',
    component: FrequencyBasic,
  },
  custom: {
    label: 'Custom',
    component: FrequencyCustom,
  },
};

export const Frequency = ({ checkType, disabled }: ProbeOptionsProps) => {
  const {
    control,
    formState: { errors },
    getValues,
  } = useFormContext<CheckFormValues>();
  const { field } = useController({ control, name: 'frequency' });
  const styles = useStyles2(getStyles);
  const { frequency: frequencyInSeconds } = getValues();
  const isBasic = FREQUENCY_OPTIONS.includes(frequencyInSeconds);
  const [activeTab, setActiveTab] = useState<'basic' | 'custom'>(isBasic ? 'basic' : 'custom');
  const frequencyError = errors?.frequency?.message;
  const TabComponent = TABS[activeTab].component;
  const minFrequency = MIN_FREQUENCY_MAP[checkType];
  const revalidateForm = useRevalidateForm();

  const handleChange = useCallback(
    (value: number) => {
      field.onChange(value);
      revalidateForm();
    },
    [field, revalidateForm]
  );

  return (
    <Field
      invalid={Boolean(frequencyError) || undefined}
      error={frequencyError}
      className={styles.field}
      id={FREQUENCY_INPUT_ID}
      data-testid={DataTestIds.FREQUENCY_COMPONENT}
      data-form-name="frequency" // this is used to assist form when trying to scroll/focus error field
    >
      <Stack direction="column" gap={1.5}>
        <Stack direction="column" gap={0.5}>
          <Text element="h3" variant="h6">
            Frequency
          </Text>
          <Text variant="bodySmall" color="secondary">
            How frequently the check should run.
          </Text>
        </Stack>
        <TabsBar>
          {TAB_KEYS.map((tab) => (
            <Tab key={tab} label={TABS[tab].label} active={activeTab === tab} onChangeTab={() => setActiveTab(tab)} />
          ))}
        </TabsBar>
        <div>
          <Stack direction="column" gap={2}>
            <div>
              <TabComponent
                value={field.value}
                onChange={handleChange}
                min={minFrequency}
                max={MAX_BASE_FREQUENCY}
                disabled={disabled}
              />
            </div>
          </Stack>
        </div>
      </Stack>
    </Field>
  );
};

const getStyles = (_theme: GrafanaTheme2) => ({
  field: css`
    margin-bottom: 0;
  `,
});
