import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface LayoutSectionHeaderProps extends PropsWithChildren {
  primary?: true;
}

export function LayoutSectionHeader({ children, primary }: LayoutSectionHeaderProps) {
  const className = useStyles2(getClassName);

  return <div className={cx(className, primary && 'CheckEditor__main-content')}>{children}</div>;
}

function getClassName(theme: GrafanaTheme2) {
  return css`
    height: 56px;
    border-bottom: 1px solid ${theme.colors.border.medium};
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    overflow-x: auto;
    &.CheckEditor__main-content {
      // This is needed to fill the gap between the main content and the splitter
    }

    &:not(&.CheckEditor__main-content) {
      &::after {
        display: block;
        content: ' ';
        position: absolute;
        width: 16px;
        height: 56px; // important to use px here, to not cause pixel shifting when resizing
        border-bottom: 1px solid ${theme.colors.border.medium};
        top: 0;
        left: -16px;
        bottom: -1px;
        pointer-events: none;
      }
    }
  `;
}
