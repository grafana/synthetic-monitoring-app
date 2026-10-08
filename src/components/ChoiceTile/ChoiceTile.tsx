import React, { ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Box, Card, Icon, IconName, Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

type LinkAction = {
  href: string;
  onClick?: () => void;
  selected?: never;
};

type ButtonAction = {
  href?: never;
  onClick: () => void;
  /** Presents the tile as one of several mutually exclusive choices. */
  selected?: boolean;
};

export type ChoiceTileProps = (LinkAction | ButtonAction) & {
  title: string;
  description?: ReactNode;
  icon: IconName | ReactNode;
  /** Status shown beside the content; it sits above the tile's click target so it can hold its own controls. */
  adornment?: ReactNode;
  disabled?: boolean;
  /** Shown under the description when the tile is disabled for a reason specific to it. */
  disabledReason?: string;
  'data-testid'?: string;
  'data-fs-element'?: string;
};

/**
 * One option in a `ChoiceTileGrid`: a `Card` whose whole surface opens the option.
 */
export function ChoiceTile({
  title,
  description,
  icon,
  adornment,
  disabled = false,
  disabledReason,
  href,
  onClick,
  selected,
  'data-testid': testId,
  'data-fs-element': fsElement,
}: ChoiceTileProps) {
  const styles = useStyles2(getStyles);
  const reason = disabled ? disabledReason : undefined;

  return (
    <Card
      role="listitem"
      noMargin
      // Card only blocks pointer events when disabled, so drop the target to keep keyboard users out too.
      href={disabled ? undefined : href}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      isSelected={selected}
      data-testid={testId}
      data-fs-element={fsElement}
    >
      <Card.Heading className={cx(disabled && styles.disabledText)}>{title}</Card.Heading>
      <Card.Figure>
        <span className={cx(styles.icon, disabled && styles.iconDisabled)} aria-hidden="true">
          {typeof icon === 'string' ? <Icon name={icon as IconName} size="xl" /> : icon}
        </span>
      </Card.Figure>
      {(description || reason) && (
        <Card.Description>
          {description}
          {reason && (
            <Box marginTop={0.5}>
              <Text variant="bodySmall" color="warning">
                {reason}
              </Text>
            </Box>
          )}
        </Card.Description>
      )}
      {adornment && <Card.Tags>{adornment}</Card.Tags>}
    </Card>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
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
  disabledText: css({
    color: theme.colors.text.disabled,
  }),
});
