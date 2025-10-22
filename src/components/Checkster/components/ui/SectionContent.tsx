import React, { PropsWithChildren } from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { FIELD_SPACING } from '../../constants';
import { useChecksterContext } from '../../contexts/ChecksterContext';
import { Column } from './Column';

interface SectionContentProps extends PropsWithChildren {
  noWrapper?: boolean; // Enable to render without wrapper component
}

export function SectionContent({ children, noWrapper }: SectionContentProps) {
  const theme = useTheme2();

  const {
    formNavigation: { active },
  } = useChecksterContext();

  return (
    <div
      tabIndex={0}
      role="tabpanel"
      aria-labelledby={`form-section-${active}`}
      className={css`
        display: flex;
        flex-direction: column;
        flex: 1 0 0;
        gap: ${theme.spacing(FIELD_SPACING)};
        padding-top: ${theme.spacing(FIELD_SPACING)};
      `}
    >
      {noWrapper ? (
        children
      ) : (
        <Column overflow="auto" fill gap={FIELD_SPACING} padding={theme.spacing(0, 2, 2, 2)}>
          {children}
        </Column>
      )}
    </div>
  );
}
