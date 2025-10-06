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
    <div className={cx(primaryClassName, className)} {...primaryProps}>
      <LayoutSectionHeader primary>{headerContent}</LayoutSectionHeader>
      <LayoutSectionContent>{children}</LayoutSectionContent>
    </div>
  );
}

function getClassName(_theme: GrafanaTheme2) {
  return css`
    container-name: ${CSS_PRIMARY_CONTAINER_NAME};
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    height: 100%;
  `;
}
