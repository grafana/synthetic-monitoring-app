import React, { FC, ChangeEvent } from 'react';
import { Slider, Input } from '@grafana/ui';
import { css } from 'emotion';

interface Props {
  value: number;
  min: number;
  max: number;
  id?: string;
  separationLabel?: string;
  step?: number;
  suffixLabel?: string;
  invalid?: boolean;
  onChange: (value: number) => void;
  onBlur: () => void;
}

const styles = {
  container: css`
    display: flex;
    align-items: center;
  `,
  slider: css`
    width: 14rem;
    margin-right: 1.5rem;
    margin-left: 0;
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
};

export const SliderInput: FC<Props> = ({
  value,
  min,
  max,
  id,
  onChange,
  separationLabel,
  suffixLabel,
  invalid,
  step = 1,
  onBlur,
}) => (
  <div className={styles.container}>
    <div className={styles.slider}>
      <Slider
        tooltipAlwaysVisible={false}
        css={styles.slider}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onAfterChange={([value]) => {
          onChange(value);
          onBlur();
        }}
      />
    </div>
    <div className={styles.inputGroupWrapper}>
      <span className={styles.rightMargin}>{separationLabel}</span>
      <Input
        id={id}
        invalid={invalid}
        onBlur={onBlur}
        className={styles.sliderInput}
        type="number"
        value={value}
        step={step}
        max={max}
        min={min}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.valueAsNumber)}
      />
      {suffixLabel}
    </div>
  </div>
);
