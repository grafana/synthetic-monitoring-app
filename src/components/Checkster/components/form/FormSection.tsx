import React, { PropsWithChildren, useEffect } from 'react';

import { FormFieldMatch, FormSectionName } from '../../types';

import { useChecksterContext } from '../../contexts/ChecksterContext';

interface FormSectionProps extends PropsWithChildren {
  sectionName: FormSectionName;
  fields?: Array<FormFieldMatch | RegExp | string>;
  // Use this to change the section label, including nav label
  // Default: value of FormSectioName enum key
  navLabel?: string;
}

export function FormSection({ sectionName, children, fields, navLabel }: FormSectionProps) {
  const {
    formNavigation: { isSectionActive, registerSection },
  } = useChecksterContext();

  useEffect(() => {
    const fieldsToRegister = fields && Array.isArray(fields) ? fields : undefined;
    registerSection(sectionName, fieldsToRegister, navLabel);
  }, [fields, navLabel, registerSection, sectionName]);

  const isActive = isSectionActive(sectionName);

  if (!isActive) {
    return null;
  }

  return <>{children}</>;
}
