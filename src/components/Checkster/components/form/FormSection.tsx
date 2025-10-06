import React, { PropsWithChildren, useEffect } from 'react';

import { FormFieldMatch, FormSectionName } from '../../types';

import { useChecksterContext } from '../../contexts/ChecksterContext';

interface FormSectionProps extends PropsWithChildren {
  sectionName: FormSectionName;
  fields?: Array<FormFieldMatch | RegExp | string>;
}

export function FormSection({ sectionName, children, fields }: FormSectionProps) {
  const {
    formNavigation: { isSectionActive, registerSectionFields },
  } = useChecksterContext();

  useEffect(() => {
    console.log('setting shit');
    if (fields && Array.isArray(fields)) {
      registerSectionFields(sectionName, fields);
    }
  }, [fields, registerSectionFields, sectionName]);

  const isActive = isSectionActive(sectionName);

  if (!isActive) {
    return null;
  }

  return <>{children}</>;
}
