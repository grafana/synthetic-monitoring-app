import React, { ReactElement, useCallback, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { SelectableValue } from '@grafana/data';
import { Combobox, Field, RadioButtonGroup, Stack, Tab, TabsBar, Text } from '@grafana/ui';
import { MAX_BASE_FREQUENCY } from 'schemas/general/Frequency';

import { CheckFormValues, CheckType } from 'types';
import { formatDuration } from 'utils';

import { FREQUENCY_OPTIONS, MIN_FREQUENCY_MAP } from './Frequency.constants';
interface ProbeOptionsProps {
  checkType: CheckType;
  disabled?: boolean;
}

interface FrequencyComponentProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

const TAB_KEYS = ['basic', 'custom'] as const;

const TABS: Record<
  (typeof TAB_KEYS)[number],
  { label: string; component: (props: FrequencyComponentProps) => ReactElement }
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
    control,
    formState: { errors },
    getValues,
  } = useFormContext<CheckFormValues>();
  const { frequency } = getValues();
  const frequencyInSeconds = frequency;
  const isBasic = FREQUENCY_OPTIONS.includes(frequencyInSeconds);
  const [activeTab, setActiveTab] = useState<'basic' | 'custom'>(isBasic ? 'basic' : 'custom');
  const frequencyError = errors?.frequency?.message;
  const TabComponent = TABS[activeTab].component;
  const minFrequency = MIN_FREQUENCY_MAP[checkType];

  return (
    <Field invalid={Boolean(frequencyError)} error={frequencyError}>
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
          <Controller
            control={control}
            name="frequency"
            render={({ field }) => (
              <Stack direction="column" gap={2}>
                <Stack direction="column" gap={0.5}>
                  <Text variant="bodySmall" color="secondary">
                    Minimum frequency: {formatDuration(minFrequency)}
                  </Text>
                  <Text variant="bodySmall" color="secondary">
                    Maximum frequency: {formatDuration(MAX_BASE_FREQUENCY)}
                  </Text>
                </Stack>
                <div>
                  <TabComponent
                    value={field.value}
                    onChange={field.onChange}
                    min={minFrequency}
                    max={MAX_BASE_FREQUENCY}
                  />
                </div>
              </Stack>
            )}
          />
        </div>
      </Stack>
    </Field>
  );
};

function BasicFrequency({ value, onChange, min, max }: FrequencyComponentProps) {
  return (
    <RadioButtonGroup
      options={FREQUENCY_OPTIONS.filter((option) => option >= min && option <= max).map((option) => ({
        label: formatDuration(option, true),
        value: option,
      }))}
      disabledOptions={FREQUENCY_OPTIONS.filter((option) => option < min || option > max)}
      value={value}
      onChange={(value) => onChange(value)}
    />
  );
}

const SIXTY_OPTIONS = Array.from({ length: 60 }, (_, i) => i);

function CustomFrequency({ value, onChange }: FrequencyComponentProps) {
  const valueInSeconds = value / 1000;
  const minutes = Math.floor(valueInSeconds / 60);
  const seconds = valueInSeconds % 60;

  const handleUpdateFrequency = useCallback(
    (minutes: number, seconds: number) => {
      onChange(minutes + seconds);
    },
    [onChange]
  );

  const handleMinutesChange = useCallback(
    ({ value }: SelectableValue<number>) => {
      if (value) {
        handleUpdateFrequency(value * 60 * 1000, seconds * 1000);
      }
    },
    [seconds, handleUpdateFrequency]
  );

  const handleSecondsChange = useCallback(
    ({ value }: SelectableValue<number>) => {
      if (value) {
        handleUpdateFrequency(minutes * 60 * 1000, value * 1000);
      }
    },
    [minutes, handleUpdateFrequency]
  );

  const width = 10;

  return (
    <Stack direction="column" gap={1}>
      <Stack>
        <Field label="Minutes">
          <Combobox
            options={SIXTY_OPTIONS.map((option) => ({ label: option.toString(), value: option }))}
            onChange={handleMinutesChange}
            value={minutes}
            width={width}
          />
        </Field>
        <Field label="Seconds">
          <Combobox
            options={SIXTY_OPTIONS.map((option) => ({ label: option.toString(), value: option }))}
            onChange={handleSecondsChange}
            value={seconds}
            width={width}
          />
        </Field>
      </Stack>
    </Stack>
  );
}
