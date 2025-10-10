import React, { PropsWithChildren, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { useAppContainerContext } from '../../contexts/AppContainerContext';
import { LayoutSectionContent } from './LayoutSectionContent';
import { LayoutSectionHeader } from './LayoutSectionHeader';

interface SecondaryLayoutSectionProps extends PropsWithChildren {
  headerContent: ReactNode;
}

export function SecondaryLayoutSection({ children, headerContent }: SecondaryLayoutSectionProps) {
  const styles = useStyles2(getStyles);
  const {
    secondaryProps: { className: secondaryClassname, ...secondaryProps },
    splitterProps: { className: splitterClassname, ...splitterProps },
  } = useAppContainerContext();

  return (
    <>
      <div className={cx(splitterClassname, styles.splitter)} {...splitterProps} />
      <div className={cx(secondaryClassname, styles.secondary)} {...secondaryProps}>
        <LayoutSectionHeader>{headerContent}</LayoutSectionHeader>
        <LayoutSectionContent>{children}</LayoutSectionContent>
      </div>
    </>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    secondary: css`
      display: flex;
      flex-direction: column;
    `,
    splitter: css`
      &::before {
        border-right: 1px solid ${theme.colors.border.medium};
      }
    `,
  };
}
