import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { TimeSlider } from './TimeSlider/TimeSlider';

interface Props {
  defaultValue: number;
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

export const SliderInput = ({ min, max, name, step = 1, validate, defaultValue }: Props) => {
  const styles = useStyles2(getStyles);
  const { register, setValue, setError, getValues, clearErrors } = useFormContext(); // TODO: type correctly

  useEffect(() => {
    register(name);
    setValue(name, defaultValue);
  }, [name, register, defaultValue, setValue]);

  return (
    <div className={styles.container} data-testid={name}>
      <div className={styles.slider}>
        <TimeSlider
          min={min ?? 0}
          max={max}
          step={step}
          value={getValues(name)}
          onChange={(value) => {
            const error = validate && validate(value);
            if (error) {
              setError(name, { message: error });
            } else {
              clearErrors(name);
              setValue(name, value);
            }
          }}
        />
      </div>
    </div>
  );
};
