import React, { ReactElement, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Alert, Combobox, ComboboxOption, Field, RadioButtonGroup, Stack, Tab, TabsBar, Text } from '@grafana/ui';

import { CheckFormValues, CheckType } from 'types';
import { formatDuration } from 'utils';

import { FREQUENCY_OPTIONS, MIN_FREQUENCY_MAP } from './Frequency.constants';
interface ProbeOptionsProps {
  checkType: CheckType;
  disabled?: boolean;
}

const TAB_KEYS = ['basic', 'custom'] as const;

interface TabComponentProps {
  frequency: number;
  minFrequency: number;
}

const TABS: Record<
  (typeof TAB_KEYS)[number],
  { label: string; component: (props: TabComponentProps) => ReactElement }
> = {
  basic: {
    label: 'Basic',
    component: BasicFrequency,
  },
  custom: {
    label: 'Custom',
    component: CustomFrequency,
  },
};

export const Frequency = ({ checkType, disabled }: ProbeOptionsProps) => {
  const {
    formState: { errors },
    getValues,
  } = useFormContext<CheckFormValues>();
  const { frequency } = getValues();
  const frequencyInSeconds = frequency;
  console.log({
    frequency,
    frequencyInSeconds,
  });
  const isBasic = FREQUENCY_OPTIONS.includes(frequencyInSeconds);
  const [activeTab, setActiveTab] = useState<'basic' | 'custom'>(isBasic ? 'basic' : 'custom');
  const frequencyError = errors?.frequency?.message;
  const TabComponent = TABS[activeTab].component;
  const minFrequency = MIN_FREQUENCY_MAP[checkType];

  return (
    <Stack direction="column" gap={1}>
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
        <TabComponent frequency={frequency} minFrequency={minFrequency} />
      </div>
      {frequencyError && (
        <Alert severity="error" title={frequencyError}>
          {frequencyError}
        </Alert>
      )}
    </Stack>
  );

  // return (
  //   <Field
  //     label="Frequency"
  //     description="How frequently the check should run."
  //     invalid={Boolean(errors.frequency)}
  //     error={errors.frequency?.message}
  //   >
  //     <SliderInput disabled={disabled} name="frequency" min={minFrequency} max={maxFrequency} />
  //   </Field>
  // );
};

function BasicFrequency({ minFrequency }: TabComponentProps) {
  const { control } = useFormContext<CheckFormValues>();

  return (
    <Controller
      control={control}
      name="frequency"
      render={({ field }) => (
        <RadioButtonGroup
          options={FREQUENCY_OPTIONS.map((option) => ({ label: formatDuration(option, true), value: option }))}
          value={field.value}
          onChange={(value) => field.onChange(value)}
        />
      )}
    />
  );
}

function CustomFrequency({ frequency, minFrequency }: TabComponentProps) {
  const handleMinutesChange = (value: ComboboxOption<number>) => {
    console.log(value);
  };

  const handleSecondsChange = (value: ComboboxOption<number>) => {
    console.log(value);
  };

  return (
    <Stack direction="column" gap={1}>
      <Text>Custom time</Text>
      <Text variant="bodySmall" color="secondary">
        Maximum total time: {formatDuration(minFrequency)}
      </Text>
      <Stack>
        <Field label="Minutes" description="Minutes">
          <Combobox options={[]} onChange={handleMinutesChange} />
        </Field>
        <Field label="Seconds" description="Seconds">
          <Combobox options={[]} onChange={handleSecondsChange} />
        </Field>
      </Stack>
    </Stack>
  );
}
