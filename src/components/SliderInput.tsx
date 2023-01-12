import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Slider, useStyles } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme } from '@grafana/data';

interface Props {
  defaultValue: number;
  min: number;
  max: number;
  name: string;
  id?: string;
  validate?: (value: number) => string | undefined;
  prefixLabel?: string;
  step?: number;
  suffixLabel?: string;
  invalid?: boolean;
}

const getStyles = (theme: GrafanaTheme) => ({
  container: css`
    display: flex;
    align-items: center;
  `,
  slider: css`
    width: 250px;
    margin-right: ${theme.spacing.md};
    margin-left: ${theme.spacing.sm};
  `,
  inputGroupWrapper: css`
    margin-top: 1rem;
    display: flex;
    align-items: center;
  `,
  rightMargin: css`
    margin-right: 0.5rem;
  `,
  sliderInput: css`
    width: 40px;
    margin-right: 0.5rem;
  `,
});

export const SliderInput = ({ min, max, prefixLabel, suffixLabel, name, step = 1, validate, defaultValue }: Props) => {
  const styles = useStyles(getStyles);
  const { register, setValue, setError, getValues, clearErrors } = useFormContext();

  useEffect(() => {
    register(name);
    setValue(name, defaultValue);
  }, [name, register, defaultValue, setValue]);

  return (
    <div className={styles.container} data-testid={name}>
      {prefixLabel}
      <div className={styles.slider}>
        <Slider
          tooltipAlwaysVisible={false}
          css={styles.slider}
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
      {suffixLabel}
    </div>
  );
};
// <Controller
//   control={control}
//   name={name}
//   rules={rules}
//   defaultValue={[defaultValue]}
//   render={({ field }) => {
//     const picked =
//    return <Slider {...field} tooltipAlwaysVisible={false} css={styles.slider} min={min} max={max} step={step} />
//   }}
// />
