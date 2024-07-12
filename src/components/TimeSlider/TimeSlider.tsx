import React, { ChangeEvent, FocusEvent, useCallback, useId, useState } from 'react';
import { Input, useStyles2 } from '@grafana/ui';
import { cx } from '@emotion/css';
import SliderComponent from 'rc-slider';

import { getStyles } from './styles';

export interface SliderProps {
  /** If the value is true, it means a continuous value interval, otherwise, it is a independent value. */
  // defaultValue: number;
  analyticsLabel?: string;
  ariaLabelForHandle?: string;
  disabled?: boolean;
  formatTooltipResult?: (value: number) => number;
  included?: boolean;
  max: number;
  min: number;
  onAfterChange?: (value?: number) => void;
  onChange?: (value: number) => void;
  step?: number;
  tooltipAlwaysVisible?: boolean;
  value?: number;
}

export function TimeSlider({
  analyticsLabel,
  ariaLabelForHandle,
  disabled,
  included,
  max,
  min,
  onAfterChange,
  onChange,
  step,
  value,
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
        <div data-fs-element={`${analyticsLabel} slider`} className={styles.sliderWrapper}>
          <SliderWithTooltip
            ariaLabelForHandle={ariaLabelForHandle}
            disabled={disabled}
            included={included}
            max={max}
            min={min}
            onChange={onSliderChange}
            onChangeComplete={handleChangeComplete}
            step={step}
            value={sliderValue}
          />
        </div>
        <Input
          aria-label={`${analyticsLabel} minutes input`}
          className={cx(styles.sliderInputField)}
          data-fs-element={`${analyticsLabel} minutes input`}
          disabled={disabled}
          id={minutesId}
          onBlur={onMinutesInputBlur}
          onChange={onMinutesInputChange}
          type="text"
          value={minutes}
        />
        <label htmlFor={minutesId}>minutes</label>

        <Input
          aria-label={`${analyticsLabel} seconds input`}
          className={cx(styles.sliderInputField)}
          data-fs-element={`${analyticsLabel} seconds input`}
          disabled={disabled}
          id={secondsId}
          onBlur={onSecondsInputBlur}
          onChange={onSecondsInputChange}
          type="text"
          value={seconds}
        />
        <label htmlFor={secondsId}>seconds</label>
      </div>
    </div>
  );
}
