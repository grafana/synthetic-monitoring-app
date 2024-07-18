import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export const getStyles = (theme: GrafanaTheme2, hasMarks = false) => {
  const railColor = theme.colors.border.strong;
  const trackColor = theme.colors.primary.main;
  const handleColor = theme.colors.primary.main;
  const blueOpacity = theme.colors.primary.transparent;
  const hoverStyle = `box-shadow: 0px 0px 0px 6px ${blueOpacity}`;

  return {
    container: css({
      width: '100%',
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
      // gap: theme.spacing(2),
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
      width: '60px',
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
