import React, { PropsWithChildren } from 'react';

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

  if (!isActive) {
    return null;
  }

  return <>{children}</>;
}
