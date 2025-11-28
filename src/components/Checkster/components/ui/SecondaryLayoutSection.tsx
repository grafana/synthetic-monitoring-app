import React, { PropsWithChildren, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { styleMixins, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { SECONDARY_CONTAINER_ID } from 'components/Checkster/constants';
import { useFeatureTabsContext } from 'components/Checkster/contexts/FeatureTabsContext';

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
  const { highlightedTab, activeTab } = useFeatureTabsContext();

  return (
    <>
      <div className={cx(splitterClassname, styles.splitter)} {...splitterProps} />
      <div className={cx(secondaryClassname, styles.secondary)} {...secondaryProps}>
        <LayoutSectionHeader>{headerContent}</LayoutSectionHeader>
        <LayoutSectionContent
          className={cx(styles.secondaryContent, {
            [styles.highlighted]: highlightedTab === activeTab[0],
          })}
          id={SECONDARY_CONTAINER_ID}
          key={activeTab[0]} // Force re-render when active tab changes -- clears the highlight
          tabIndex={0}
        >
          {children}
        </LayoutSectionContent>
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
    secondaryContent: css`
      /* This is needed to avoid the box-shadow from being cut off */
      margin: 4px 4px 4px 0;
      transition: box-shadow 5s ease-in-out;
    `,
    highlighted: css`
      ${styleMixins.getFocusStyles(theme)}
      transition: box-shadow 0s;
    `,
  };
}
