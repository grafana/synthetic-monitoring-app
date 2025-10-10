import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Stack, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { getBodySmallStyles } from '../../styles';

interface ValidationErrorProps extends PropsWithChildren {
  className?: string;
}

/*
                      <div className={cx(styles.errorRow, isHeaderMatchType && styles.expressionWithHeaderErrorColumn)}>
                        <Icon name="exclamation-triangle" />{errorMap.expression.error}
                      </div>
 */

export function ValidationError({ className, children }: ValidationErrorProps) {
  const defaultClassName = useStyles2(getClassName);
  return (
    <div className={cx(defaultClassName, className)} role="alert">
      <Stack gap={1} direction="row" alignItems="center">
        <Icon name="exclamation-triangle" />
        <div>{children}</div>
      </Stack>
    </div>
  );
}

function getClassName(theme: GrafanaTheme2) {
  return css`
    display: inline-block;
    background-color: ${theme.colors.error.main};
    position: relative;
    color: ${theme.colors.error.contrastText};
    padding: ${theme.spacing(0.5)} ${theme.spacing(1)};
    ${getBodySmallStyles(theme)};
    font-weight: ${theme.typography.fontWeightBold};
    border-radius: ${theme.shape.radius.default};

    &:before {
      content: '';
      position: absolute;
      left: 9px;
      top: -5px;
      width: 0;
      height: 0;
      border-width: 0 4px 5px;
      border-color: transparent transparent ${theme.colors.error.main};
      border-style: solid;
    }
  `;
}
