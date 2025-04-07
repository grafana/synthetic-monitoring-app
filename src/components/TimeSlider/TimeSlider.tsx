import React, { ChangeEvent, FocusEvent, useCallback, useId, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Input, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import SliderComponent from 'rc-slider';

export interface SliderProps {
  analyticsLabel: string;
  ariaLabelForHandle: string;
  disabled?: boolean;
  max: number;
  min: number;
  onAfterChange?: (value?: number) => void;
  onChange?: (value: number) => void;
  value: number;
}

export function TimeSlider({
  analyticsLabel,
  ariaLabelForHandle,
  disabled,
  max,
  min,
  onAfterChange,
  onChange,
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
    <div className={cx(styles.container, styles.slider)} data-testid={analyticsLabel}>
      <div className={cx(styles.sliderInput)}>
        <div data-fs-element={`${analyticsLabel} slider`} className={styles.sliderWrapper}>
          <SliderWithTooltip
            ariaLabelForHandle={ariaLabelForHandle}
            disabled={disabled}
            max={max}
            min={min}
            onChange={onSliderChange}
            onChangeComplete={handleChangeComplete}
            step={1}
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

export const getStyles = (theme: GrafanaTheme2, hasMarks = false) => {
  const railColor = theme.colors.border.strong;
  const trackColor = theme.colors.primary.main;
  const handleColor = theme.colors.primary.main;
  const blueOpacity = theme.colors.primary.transparent;
  const hoverStyle = `box-shadow: 0px 0px 0px 6px ${blueOpacity}`;

  return {
    container: css({
      width: '100%',
      maxWidth: '750px',
      margin: 'inherit',
      paddingBottom: hasMarks ? theme.spacing(1) : 'inherit',
      height: 'auto',
    }),
    slider: css({
      ['.rc-slider']: {
        display: 'flex',
        flexGrow: 1,
        marginLeft: '7px', // half the size of the handle to align handle to the left on 0 value
      },
      ['.rc-slider-disabled']: {
        backgroundColor: theme.isDark ? `transparent` : theme.colors.background.secondary,
      },
      ['.rc-slider-mark']: {
        top: theme.spacing(1.75),
      },
      ['.rc-slider-mark-text']: {
        color: theme.colors.text.disabled,
        fontSize: theme.typography.bodySmall.fontSize,
      },
      ['.rc-slider-mark-text-active']: {
        color: theme.colors.text.primary,
      },
      ['.rc-slider-handle']: {
        border: 'none',
        backgroundColor: handleColor,
        boxShadow: theme.shadows.z1,
        cursor: 'pointer',
        opacity: 1,
      },
      ['.rc-slider-handle:hover']: hoverStyle,
      ['.rc-slider-handle:active']: hoverStyle,
      ['.rc-slider-handle-click-focused:focus']: hoverStyle,

      // // The triple class names is needed because that's the specificity used in the source css :(
      ['.rc-slider-handle-dragging.rc-slider-handle-dragging.rc-slider-handle-dragging']: {
        boxShadow: `0 0 0 5px ${theme.colors.text.primary}`,
      },
      ['.rc-slider-handle:focus-visible']: {
        boxShadow: `0 0 0 5px ${theme.colors.text.primary}`,
      },

      ['.rc-slider-dot']: {
        backgroundColor: theme.colors.text.primary,
        borderColor: theme.colors.text.primary,
      },
      ['.rc-slider-dot-active']: {
        backgroundColor: theme.colors.text.primary,
        borderColor: theme.colors.text.primary,
      },

      ['.rc-slider-track']: {
        backgroundColor: trackColor,
      },
      ['.rc-slider-rail']: {
        backgroundColor: railColor,
        cursor: 'pointer',
      },
    }),
    sliderInput: css({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    }),
    sliderWrapper: css({
      width: '100%',
    }),
    sliderInputVertical: css({
      flexDirection: 'column',
      height: '100%',

      '.rc-slider': {
        margin: 0,
        order: 2,
      },
    }),
    sliderInputField: css({
      marginLeft: theme.spacing(3),
      marginRight: theme.spacing(1),
      maxWidth: '60px',
      minWidth: '40px',
      input: {
        textAlign: 'center',
      },
    }),
    sliderInputFieldVertical: css({
      margin: `0 0 ${theme.spacing(3)} 0`,
      order: 1,
    }),
  };
};
