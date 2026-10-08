import React, { ReactNode, useId } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, IconName, Link, styleMixins, Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

type LinkAction = {
  href: string;
  onClick?: () => void;
  expanded?: never;
};

type ButtonAction = {
  href?: never;
  onClick: () => void;
  /** Set when the tile toggles content elsewhere on the page. */
  expanded?: boolean;
};

export type ChoiceTileProps = (LinkAction | ButtonAction) & {
  title: string;
  description?: ReactNode;
  icon: IconName | ReactNode;
  /** Rendered beside the title and kept above the tile's click target so it can hold its own controls. */
  adornment?: ReactNode;
  disabled?: boolean;
  /** Shown under the description when the tile is disabled for a reason specific to it. */
  disabledReason?: string;
  selected?: boolean;
  'data-testid'?: string;
};

/**
 * A single selectable option. The whole surface is the click target, but only the title is the
 * accessible name, so assistive tech announces "HTTP, link" with the description as its description.
 */
export function ChoiceTile(props: ChoiceTileProps) {
  const {
    description,
    icon,
    adornment,
    disabled = false,
    disabledReason,
    selected = false,
    'data-testid': testId,
  } = props;
  const styles = useStyles2(getStyles);
  const descriptionId = useId();
  const reasonId = useId();
  const showReason = disabled && Boolean(disabledReason);
  const describedBy = [description && descriptionId, showReason && reasonId].filter(Boolean).join(' ') || undefined;
  const isToggle = props.href === undefined && props.expanded !== undefined;
  const trailingIcon: IconName = isToggle ? (props.expanded ? 'angle-up' : 'angle-down') : 'arrow-right';

  return (
    <div className={cx(styles.tile, selected && styles.selected, disabled && styles.disabled)} data-testid={testId}>
      <span className={cx(styles.icon, disabled && styles.iconDisabled)} aria-hidden="true">
        {typeof icon === 'string' ? <Icon name={icon as IconName} size="lg" /> : icon}
      </span>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <ChoiceTileAction {...props} className={styles.action} describedBy={describedBy} disabled={disabled} />
          {adornment && <span className={styles.adornment}>{adornment}</span>}
        </div>
        {description && (
          <Text id={descriptionId} variant="bodySmall" color="secondary">
            {description}
          </Text>
        )}
        {showReason && disabledReason && (
          <Text id={reasonId} variant="bodySmall" color="warning">
            {disabledReason}
          </Text>
        )}
      </div>
      {!disabled && <Icon name={trailingIcon} className={cx(styles.trailing, isToggle && styles.trailingVisible)} />}
    </div>
  );
}

function ChoiceTileAction(
  props: ChoiceTileProps & { className: string; describedBy?: string; disabled: boolean }
) {
  const { title, className, describedBy, disabled } = props;

  if (props.href !== undefined) {
    if (disabled) {
      return (
        <span className={className} role="link" aria-disabled="true" aria-describedby={describedBy}>
          {title}
        </span>
      );
    }

    return (
      <Link className={className} href={props.href} onClick={props.onClick} aria-describedby={describedBy}>
        {title}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      aria-expanded={props.expanded}
      aria-describedby={describedBy}
      onClick={props.onClick}
    >
      {title}
    </button>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  const trailing = css({
    color: theme.colors.text.secondary,
    opacity: 0,
    alignSelf: 'center',

    [theme.transitions.handleMotion('no-preference')]: {
      transform: `translateX(-${theme.spacing(0.5)})`,
      transition: theme.transitions.create(['opacity', 'transform'], {
        duration: theme.transitions.duration.short,
      }),
    },
  });

  return {
    tile: css({
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: `${theme.spacing(4)} minmax(0, 1fr) ${theme.spacing(2)}`,
      columnGap: theme.spacing(1.5),
      alignItems: 'start',
      height: '100%',
      padding: theme.spacing(2),
      borderRadius: theme.shape.radius.default,
      border: `1px solid ${theme.colors.border.weak}`,
      background: theme.colors.background.primary,

      [theme.transitions.handleMotion('no-preference')]: {
        transition: theme.transitions.create(['background-color', 'border-color'], {
          duration: theme.transitions.duration.short,
        }),
      },

      '&:hover, &:focus-within': {
        background: theme.colors.background.secondary,
        borderColor: theme.colors.border.medium,

        [`.${trailing}`]: {
          opacity: 1,
          transform: 'none',
        },
      },
    }),
    selected: css({
      '&, &:hover, &:focus-within': {
        background: theme.colors.action.selected,
        borderColor: theme.colors.primary.border,
      },
    }),
    disabled: css({
      cursor: 'not-allowed',

      '&:hover, &:focus-within': {
        background: theme.colors.background.primary,
        borderColor: theme.colors.border.weak,
      },
    }),
    icon: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      aspectRatio: '1',
      borderRadius: theme.shape.radius.default,
      background: theme.colors.primary.transparent,
      color: theme.colors.primary.text,
    }),
    iconDisabled: css({
      background: theme.colors.action.disabledBackground,
      color: theme.colors.text.disabled,
    }),
    body: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
      minWidth: 0,
    }),
    titleRow: css({
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing(1),
      minHeight: theme.spacing(3),
    }),
    action: css({
      all: 'unset',
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeightMedium,
      cursor: 'pointer',

      '&::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        borderRadius: theme.shape.radius.default,
      },

      '&:focus-visible': {
        outline: 'none',
      },

      '&:focus-visible::after': styleMixins.getFocusStyles(theme),

      '&[aria-disabled="true"], &:disabled': {
        color: theme.colors.text.disabled,
        cursor: 'not-allowed',
      },
    }),
    adornment: css({
      position: 'relative',
      zIndex: 1,
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
    }),
    trailing,
    trailingVisible: css({
      opacity: 1,
      transform: 'none',
    }),
  };
};
