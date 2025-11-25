import React, { PropsWithChildren, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CSS_PRIMARY_CONTAINER_NAME } from '../../constants';
import { useAppContainerContext } from '../../contexts/AppContainerContext';
import { LayoutSectionContent } from './LayoutSectionContent';
import { LayoutSectionHeader } from './LayoutSectionHeader';

interface PrimaryLayoutSectionProps extends PropsWithChildren {
  headerContent: ReactNode;
}

export function PrimaryLayoutSection({ children, headerContent }: PrimaryLayoutSectionProps) {
  const {
    primaryProps: { className: primaryClassName, ...primaryProps },
  } = useAppContainerContext();
  const className = useStyles2(getClassName);

  return (
    <div className={cx(primaryClassName)} {...primaryProps}>
      <div
        className={cx(
          className,
          css`
            display: flex;
            flex-direction: column;
            min-width: 50px; // Just to avoid splitter to get stuck
            flex-grow: 1;
            min-height: 100%;
          `
        )}
      >
        <LayoutSectionHeader primary>{headerContent}</LayoutSectionHeader>
        <LayoutSectionContent>{children}</LayoutSectionContent>
      </div>
    </div>
  );
}

function getClassName(_theme: GrafanaTheme2) {
  return css`
    container-name: ${CSS_PRIMARY_CONTAINER_NAME};
    container-type: inline-size;
    contain: layout; // Workaround for https://github.com/floating-ui/floating-ui/issues/3067
    display: flex;
    flex-direction: column;
    height: 100%;
  `;
}
