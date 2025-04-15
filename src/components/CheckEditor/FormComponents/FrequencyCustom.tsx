import React, { ChangeEvent, KeyboardEvent, useCallback, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Field, Input, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { MAX_BASE_FREQUENCY } from 'schemas/general/Frequency';

import { formatDuration } from 'utils';
import {
  FREQUENCY_MINUTES_INPUT_ID,
  FREQUENCY_SECONDS_INPUT_ID,
} from 'components/CheckEditor/FormComponents/Frequency.constants';
import { FrequencyComponentProps } from 'components/CheckEditor/FormComponents/Frequency.types';
import { frequencyInSecondsAndMinutes } from 'components/CheckEditor/FormComponents/Frequency.utils';

const INPUT_WIDTH = 10;

export const FrequencyCustom = ({ value, onChange, min, max, disabled }: FrequencyComponentProps) => {
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
    <Stack direction="column" gap={2}>
      <Stack direction="column" gap={0.5}>
        <Text variant="bodySmall" color="secondary">
          Minimum frequency: {formatDuration(min)}
        </Text>
        <Text variant="bodySmall" color="secondary">
          Maximum frequency: {formatDuration(MAX_BASE_FREQUENCY)}
        </Text>
      </Stack>
      <Stack>
        <Field label="Minutes" className={styles.field}>
          <Input
            onChange={handleMinutesChange}
            value={inputMinutes}
            width={INPUT_WIDTH}
            onBlur={handleUpdateFrequency}
            onKeyDown={handleKeyDown}
            id={FREQUENCY_MINUTES_INPUT_ID}
            disabled={disabled}
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
            disabled={disabled}
          />
        </Field>
      </Stack>
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  field: css`
    margin-bottom: 0;
  `,
});
