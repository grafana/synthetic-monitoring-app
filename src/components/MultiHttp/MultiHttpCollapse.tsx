import React, { forwardRef, PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, Stack, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

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
}

export const MultiHttpCollapse = forwardRef<HTMLButtonElement, PropsWithChildren<MultiHttpCollapseProps>>(
  function MultiHttpCollapse(
    { 'data-testid': dataTestId, label, children, invalid, isOpen, onRemove, onToggle, requestMethod },
    ref
  ) {
    const theme = useTheme2();
    const styles = useStyles2(getStyles);

    return (
      <Stack gap={1} direction={`column`}>
        <button
          className={styles.header}
          onClick={(e) => {
            e.preventDefault();
            onToggle();
          }}
          ref={ref}
          data-fs-element={`Collapse header ${label}`}
          type="button"
        >
          <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
          <div className={css({ color: getMethodColor(theme, requestMethod) })}>{requestMethod}</div>
          <div className={styles.label}>{label}</div>
          {!isOpen && invalid && <Icon name="exclamation-triangle" className={styles.errorIcon} />}
        </button>
        {isOpen && (
          <div className={styles.body} data-testid={dataTestId}>
            <div className={styles.actions}>
              {onRemove && (
                <Button
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
        )}
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
    marginRight: theme.spacing(1),
    fontSize: theme.typography.h4.fontSize,
  }),
  errorIcon: css({
    color: theme.colors.error.text,
    marginLeft: theme.spacing(1),
  }),
  body: css({
    display: `grid`,
    gridTemplateColumns: `36px auto`,
    gap: theme.spacing(2.5),
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
