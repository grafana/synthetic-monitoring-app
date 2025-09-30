import React, { PropsWithChildren } from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { FormSectionName } from '../../types';

import { useChecksterContext } from '../../contexts/ChecksterContext';

interface FormSectionProps extends PropsWithChildren {
  sectionName: FormSectionName;
}

export function FormSection({ sectionName, children }: FormSectionProps) {
  const {
    formNavigation: { isSectionActive },
  } = useChecksterContext();

  const isActive = isSectionActive(sectionName);
  const theme = useTheme2();

  if (!isActive) {
    return null;
  }

  return (
    <div
      className={css`
        padding: ${theme.spacing(2)};
      `}
    >
      <div>{children}</div>
    </div>
  );
}
