import React, { ChangeEvent, FocusEvent, useCallback, useState } from 'react';
import { Input, useStyles2 } from '@grafana/ui';
import { cx } from '@emotion/css';
import { Global } from '@emotion/react';
import SliderComponent from 'rc-slider';

import { getStyles } from './styles';

export interface SliderProps {
  min: number;
  max: number;
  step?: number;
  tooltipAlwaysVisible?: boolean;
  /** If the value is true, it means a continuous value interval, otherwise, it is a independent value. */
  included?: boolean;
  value?: number;
  onChange?: (value: number) => void;
  onAfterChange?: (value?: number) => void;
  formatTooltipResult?: (value: number) => number;
  ariaLabelForHandle?: string;
}

export function TimeSlider({
  min,
  max,
  onChange,
  onAfterChange,
  step,
  value,
  ariaLabelForHandle,
  included,
}: SliderProps) {
  const initialSeconds = (value ?? min) % 60;
  const initialMinutes = Math.floor((value ?? min) / 60);
  const styles = useStyles2(getStyles);
  const SliderWithTooltip = SliderComponent;
  const [sliderValue, setSliderValue] = useState<number>(value ?? min);
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [minutes, setMinutes] = useState<number>(initialMinutes);

  const onSliderChange = useCallback(
    (v: number | number[]) => {
      const value = typeof v === 'number' ? v : v[0];

      const minutes = Math.floor(value / 60);
      const seconds = value % 60;
      setSliderValue(value);
      setMinutes(minutes);
      setSeconds(seconds);
      onChange?.(value);
    },
    [setSliderValue, onChange]
  );

  const onMinutesInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    let v = +e.target.value;

    if (Number.isNaN(v)) {
      v = 0;
    }

    setMinutes(v);
  }, []);

  const onSecondsInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    let v = +e.target.value;

    if (Number.isNaN(v)) {
      v = 0;
    }

    setSeconds(v);
  }, []);

  // Check for min/max on input blur so user is able to enter
  // custom values that might seem above/below min/max on first keystroke
  const onMinutesInputBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      const v = +e.target.value;

      const value = v * 60 + seconds;

      if (value > max) {
        onSliderChange(max);
      } else if (v < min) {
        onSliderChange(min);
      } else {
        onSliderChange(value);
      }
    },
    [max, min, onSliderChange, seconds]
  );

  const onSecondsInputBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      const v = +e.target.value;

      const value = minutes * 60 + v;

      if (value > max) {
        onSliderChange(max);
      } else if (v < min) {
        onSliderChange(min);
      } else {
        onSliderChange(value);
      }
    },
    [max, min, minutes, onSliderChange]
  );

  const handleChangeComplete = useCallback(
    (v: number | number[]) => {
      const value = typeof v === 'number' ? v : v[0];
      onAfterChange?.(value);
    },
    [onAfterChange]
  );

  return (
    <div className={cx(styles.container, styles.slider)}>
      {/** Slider tooltip's parent component is body and therefore we need Global component to do css overrides for it. */}
      <Global styles={styles.tooltip} />
      <div className={cx(styles.sliderInput)}>
        <SliderWithTooltip
          min={min}
          max={max}
          step={step}
          defaultValue={value}
          value={sliderValue}
          onChange={onSliderChange}
          onChangeComplete={handleChangeComplete}
          ariaLabelForHandle={ariaLabelForHandle}
          included={included}
        />

        <Input
          type="text"
          className={cx(styles.sliderInputField)}
          value={minutes}
          onChange={onMinutesInputChange}
          onBlur={onMinutesInputBlur}
        />
        <span>minutes</span>

        <Input
          type="text"
          className={cx(styles.sliderInputField)}
          value={seconds}
          onChange={onSecondsInputChange}
          onBlur={onSecondsInputBlur}
        />

        <span>seconds</span>
      </div>
    </div>
  );
}
