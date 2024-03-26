import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Slider, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

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
  onChange: (value: number) => void;
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    align-items: center;
  `,
  slider: css`
    width: 250px;
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
  sliderInput: css`
    width: 40px;
    margin-right: 0.5rem;
  `,
});

export const SliderInput = ({
  min = 0,
  max,
  prefixLabel,
  suffixLabel,
  name,
  step = 1,
  defaultValue,
  onChange,
}: Props) => {
  const styles = useStyles2(getStyles);
  const [internalValue, setInternalValue] = useState(defaultValue);

  return (
    <div className={styles.container} data-testid={name}>
      {prefixLabel}
      <div className={styles.slider}>
        <Slider
          tooltipAlwaysVisible={false}
          min={min}
          max={max}
          step={step}
          value={internalValue}
          onChange={(value) => {
            setInternalValue(value);
            onChange(value);
          }}
        />
      </div>
      {suffixLabel}
    </div>
  );
};
