import React, { PropsWithChildren, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Stack, Text, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { HttpMethod } from 'types';
import { getMethodColor } from 'utils';

import { Column } from './ui/Column';
import { ErrorIcon } from './ErrorIcon';

interface CollapsibleRequestEntryProps extends PropsWithChildren {
  method: HttpMethod;
  target?: string;
  placeholder?: string;
  isOpen: boolean;
  actions?: ReactNode;
  onToggle(): void;
  hasError?: boolean;
  'aria-label'?: string;
}
export function CollapsibleRequestEntry({
  children,
  isOpen,
  onToggle,
  placeholder = 'Request',
  method,
  target,
  actions,
  hasError,
  ...rest
}: CollapsibleRequestEntryProps) {
  const theme = useTheme2();
  const styles = getStyles(theme, method);

  return (
    <Column {...rest}>
      <div className={styles.header}>
        <Text element="h4" variant="h5" onClick={onToggle}>
          <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
          {hasError && <ErrorIcon />}
          <span className={styles.methodSpan}>{method}</span>
          <span className={cx(!target && styles.placeholder)}>{target || placeholder}</span>
        </Text>
        {actions && <Stack gap={1}>{actions}</Stack>}
      </div>
      {isOpen && <div className={styles.content}>{children}</div>}
    </Column>
  );
}

function getStyles(theme: GrafanaTheme2, method: HttpMethod) {
  return {
    header: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-right: ${theme.spacing(1)};

      &:hover {
        background-color: ${theme.colors.background.secondary};
      }

      // Style by proxy
      & > h4 {
        display: flex;
        gap: ${theme.spacing(1)};
        align-items: center;
        flex-grow: 1;
        cursor: pointer;
        padding: ${theme.spacing(1)};
      }
    `,
    methodSpan: css`
      color: ${getMethodColor(theme, method)};
    `,
    placeholder: css`
      color: ${theme.colors.text.disabled};
    `,
    content: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      margin-left: ${theme.spacing(4)};
      padding: ${theme.spacing(0, 2)};
      border-left: 1px solid ${theme.colors.border.medium};
    `,
  };
}
