import React, { FC, ChangeEvent } from 'react';
import { Slider, Input } from '@grafana/ui';
import { css } from 'emotion';

interface Props {
  value: number;
  min: number;
  max: number;
  id?: string;
  separationLabel?: string;
  suffixLabel?: string;
  invalid?: boolean;
  onChange: (value: number) => void;
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

export const SliderInput: FC<Props> = ({ value, min, max, id, onChange, separationLabel, suffixLabel, invalid }) => {
  return (
    <div className={styles.container}>
      <div className={styles.slider}>
        <Slider
          tooltipAlwaysVisible={false}
          css={styles.slider}
          min={min}
          max={max}
          value={[value]}
          onAfterChange={([value]) => onChange(value)}
        />
      </div>
      <div className={styles.inputGroupWrapper}>
        <span className={styles.rightMargin}>{separationLabel}</span>
        <Input
          id={id}
          invalid={invalid}
          className={styles.sliderInput}
          type="number"
          value={value}
          max={max}
          min={min}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.valueAsNumber)}
        />
        {suffixLabel}
      </div>
    </div>
  );
};
