import React, { ChangeEvent, KeyboardEvent, ReactElement, useCallback, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Field, Input, RadioButtonGroup, Stack, Tab, TabsBar, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
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
export const FREQUENCY_INPUT_ID = 'frequency-input';
export const FREQUENCY_SECONDS_INPUT_ID = 'frequency-seconds-input';
export const FREQUENCY_MINUTES_INPUT_ID = 'frequency-minutes-input';

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
  const styles = useStyles2(getStyles);
  const { frequency } = getValues();
  const frequencyInSeconds = frequency;
  const isBasic = FREQUENCY_OPTIONS.includes(frequencyInSeconds);
  const [activeTab, setActiveTab] = useState<'basic' | 'custom'>(isBasic ? 'basic' : 'custom');
  const frequencyError = errors?.frequency?.message;
  const TabComponent = TABS[activeTab].component;
  const minFrequency = MIN_FREQUENCY_MAP[checkType];

  return (
    <Field
      invalid={Boolean(frequencyError) || undefined}
      error={frequencyError}
      className={styles.field}
      id={FREQUENCY_INPUT_ID}
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

const INPUT_WIDTH = 10;

function CustomFrequency({ value, onChange }: FrequencyComponentProps) {
  const styles = useStyles2(getStyles);
  const { minutes, seconds } = frequencyInSecondsAndMinutes(value);

  const [inputMinutes, setInputMinutes] = useState<number | undefined>(minutes);
  const [inputSeconds, setInputSeconds] = useState<number | undefined>(seconds);

  const handleUpdateFrequency = useCallback(() => {
    const convertedMinutes = (inputMinutes || 0) * 60 * 1000;
    const convertedSeconds = (inputSeconds || 0) * 1000;

    const newFrequency = convertedMinutes + convertedSeconds;
    onChange(newFrequency);

    const res = frequencyInSecondsAndMinutes(newFrequency);
    setInputMinutes(res.minutes);
    setInputSeconds(res.seconds);
  }, [onChange, inputMinutes, inputSeconds]);

  const handleMinutesChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const minutes = parseInt(event.target.value, 10) || undefined;
    setInputMinutes(minutes);
  }, []);

  const handleSecondsChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const seconds = parseInt(event.target.value, 10) || undefined;
    setInputSeconds(seconds);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        if (inputSeconds !== seconds) {
          event.preventDefault();
        }

        handleUpdateFrequency();
      }
    },
    [handleUpdateFrequency, inputSeconds, seconds]
  );

  return (
    <Stack>
      <Field label="Minutes" className={styles.field}>
        <Input
          onChange={handleMinutesChange}
          value={inputMinutes}
          width={INPUT_WIDTH}
          onBlur={handleUpdateFrequency}
          onKeyDown={handleKeyDown}
          id={FREQUENCY_MINUTES_INPUT_ID}
        />
      </Field>
      <Field label="Seconds" className={styles.field}>
        <Input
          onChange={handleSecondsChange}
          value={inputSeconds}
          width={INPUT_WIDTH}
          onBlur={handleUpdateFrequency}
          onKeyDown={handleKeyDown}
          id={FREQUENCY_SECONDS_INPUT_ID}
        />
      </Field>
    </Stack>
  );
}

function frequencyInSecondsAndMinutes(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);

  return { minutes, seconds };
}

const getStyles = (theme: GrafanaTheme2) => ({
  field: css`
    margin-bottom: 0;
  `,
});
