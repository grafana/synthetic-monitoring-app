import React, { Fragment, PropsWithChildren, ReactNode } from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { FIELD_SPACING } from '../../constants';
import { useChecksterContext } from '../../contexts/ChecksterContext';
import { Column } from './Column';

interface SectionContentProps extends PropsWithChildren {
  label?: ReactNode;
  vanilla?: boolean; // No content styling
  showHeading?: boolean;
}

export function SectionContent({ label, vanilla, children, showHeading = false }: SectionContentProps) {
  const theme = useTheme2();

  const {
    formNavigation: { activeLabel },
  } = useChecksterContext();

  const Wrapper = vanilla ? Fragment : Column;

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        flex: 1 0 0;
        gap: ${theme.spacing(FIELD_SPACING)};
        ${!showHeading &&
        css`
          padding-top: ${theme.spacing(FIELD_SPACING)};
        `};
        & > h2 {
          padding: ${theme.spacing(2)};
          margin: 0;
        }
      `}
    >
      {showHeading && <h2>{label || activeLabel}</h2>}
      <Wrapper overflow="auto" fill gap={FIELD_SPACING} padding={theme.spacing(0, 2, 2, 2)}>
        {children}
      </Wrapper>
    </div>
  );
}
