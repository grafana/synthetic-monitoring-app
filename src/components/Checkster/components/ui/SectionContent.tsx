import React, { Fragment, PropsWithChildren, ReactNode } from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormFieldPath } from '../../types';

import { FIELD_SPACING } from '../../constants';
import { useChecksterContext } from '../../contexts/ChecksterContext';
import { Column } from './Column';

interface SectionContentProps extends PropsWithChildren {
  label?: ReactNode;
  vanilla?: boolean; // No content styling
  fields?: CheckFormFieldPath[];
}

export function SectionContent({ label, vanilla, children }: SectionContentProps) {
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
        & > h2 {
          padding: ${theme.spacing(2)};
          margin: 0;
        }
      `}
    >
      <h2>{label || activeLabel}</h2>
      <Wrapper fill gap={FIELD_SPACING} padding={theme.spacing(0, 2, 2, 2)}>
        {children}
      </Wrapper>
    </div>
  );
}
