import React, { forwardRef, PropsWithChildren, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, Stack, Text, useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { HttpMethod } from 'types';
import { getMethodColor } from 'utils';

interface MultiHttpCollapseProps {
  'data-testid'?: string;
  label: string;
  invalid?: boolean;
  className?: string | string[];
  isOpen: boolean;
  onToggle: () => void;
  onRemove?: () => void;
  requestMethod: HttpMethod;
  suffix?: ReactNode;
}

export const MultiHttpCollapse = forwardRef<HTMLButtonElement, PropsWithChildren<MultiHttpCollapseProps>>(
  function MultiHttpCollapse(
    { 'data-testid': dataTestId, label, children, invalid, isOpen, onRemove, onToggle, requestMethod, suffix },
    ref
  ) {
    const theme = useTheme2();
    const styles = useStyles2(getStyles);

    return (
      <Stack gap={1} direction={`column`} data-testid={dataTestId}>
        <button
          className={styles.header}
          onClick={(e) => {
            e.preventDefault();
            onToggle();
          }}
          ref={ref}
          type="button"
          aria-expanded={isOpen}
        >
          <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
          <div className={css({ color: getMethodColor(theme, requestMethod) })}>{requestMethod}</div>
          <Text element="span" variant="h4">
            {label}
          </Text>
          {suffix}
          {invalid && <Icon name="exclamation-triangle" className={styles.errorIcon} />}
        </button>

        <div
          className={cx(styles.body, {
            // we default to using css here so the event listeners are available for the nested content
            [styles.isOpen]: isOpen,
          })}
        >
          <div className={styles.actions}>
            {onRemove && (
              <Button
                aria-label={`Remove request ${label}`}
                className={styles.removeButton}
                variant="secondary"
                onClick={onRemove}
                data-fs-element={`Remove ${label}`}
                icon="trash-alt"
                tooltip={`Remove request`}
                size="sm"
              />
            )}
          </div>
          <div>{children}</div>
        </div>
      </Stack>
    );
  }
);

const getStyles = (theme: GrafanaTheme2) => ({
  header: css({
    backgroundColor: `transparent`,
    border: 0,
    display: `flex`,
    alignItems: `center`,
    padding: theme.spacing(2, 0),
    width: `100%`,
    gap: theme.spacing(1),

    [`&:hover`]: {
      backgroundColor: theme.colors.background.secondary,
    },
  }),
  label: css({
    fontSize: theme.typography.h4.fontSize,
  }),
  errorIcon: css({
    color: theme.colors.error.text,
    marginLeft: theme.spacing(1),
  }),
  body: css({
    display: `none`,
    gridTemplateColumns: `36px auto`,
    gap: theme.spacing(2.5),
  }),
  isOpen: css({
    display: `grid`,
  }),
  actions: css({
    borderRight: `1px solid ${theme.colors.border.medium}`,
  }),
  removeButton: css({
    borderRadius: `50%`,
    padding: 0,
    width: theme.spacing(3),
    height: theme.spacing(3),
    alignItems: `center`,
    justifyContent: `center`,
  }),
});
