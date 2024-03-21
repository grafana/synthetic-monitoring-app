import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { TimeSlider } from './TimeSlider/TimeSlider';

export interface SliderInputProps {
  min: number;
  max: number;
  name: string;
  id?: string;
  validate?: (value: number) => string | undefined;
  step?: number;
  invalid?: boolean;
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    align-items: center;
  `,
  slider: css`
    width: 100%;
    max-width: 750px;
    margin-right: ${theme.spacing(2)};
    margin-left: ${theme.spacing(1)};
  `,
  inputGroupWrapper: css`
    margin-top: 1rem;
    display: flex;
    align-items: center;
  `,
  rightMargin: css`
    margin-right: 0.5rem;
  `,
});

export const SliderInput = ({ min, max, name, step = 1, validate }: SliderInputProps) => {
  const styles = useStyles2(getStyles);
  const { control } = useFormContext(); // TODO: type correctly

  return (
    <div className={styles.container} data-testid={name}>
      <div className={styles.slider}>
        <Controller
          name={name}
          control={control}
          rules={{ validate: (v) => validate?.(v) }}
          render={({ field }) => {
            const { ref, ...rest } = field;
            return <TimeSlider {...rest} min={min ?? 0} max={max} step={step} />;
          }}
        />
      </div>
    </div>
  );
};
