import React, { ChangeEvent, FocusEvent, useCallback, useId, useState } from 'react';
import { Input, useStyles2 } from '@grafana/ui';
import { cx } from '@emotion/css';
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
  // defaultValue: number;
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
  const minutesId = useId();
  const secondsId = useId();
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

      const totalSeconds = v * 60 + seconds;

      if (totalSeconds > max) {
        onSliderChange(max);
      } else if (totalSeconds < min) {
        onSliderChange(min);
      } else {
        onSliderChange(totalSeconds);
      }
    },
    [max, min, onSliderChange, seconds]
  );

  const onSecondsInputBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      const v = +e.target.value;

      const totalSeconds = minutes * 60 + v;

      if (totalSeconds > max) {
        onSliderChange(max);
      } else if (totalSeconds < min) {
        onSliderChange(min);
      } else {
        onSliderChange(totalSeconds);
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
      <div className={cx(styles.sliderInput)}>
        <SliderWithTooltip
          min={min}
          max={max}
          step={step}
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
          id={minutesId}
        />
        <label htmlFor={minutesId}>minutes</label>

        <Input
          type="text"
          className={cx(styles.sliderInputField)}
          value={seconds}
          onChange={onSecondsInputChange}
          onBlur={onSecondsInputBlur}
          id={secondsId}
        />
        <label htmlFor={secondsId}>seconds</label>
      </div>
    </div>
  );
}
