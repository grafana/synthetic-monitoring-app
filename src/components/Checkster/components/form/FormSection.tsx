import React, { PropsWithChildren, useEffect, useRef } from 'react';

import { FormSectionName, SectionIncludedField } from '../../types';

import { useChecksterContext } from '../../contexts/ChecksterContext';

interface FormSectionProps extends PropsWithChildren {
  sectionName: FormSectionName;
  fields?: SectionIncludedField[];
}

export function FormSection({ sectionName, children, fields = [] }: FormSectionProps) {
  const fieldsRef = useRef<SectionIncludedField[]>([]);
  fieldsRef.current = fields;
  const fieldsChecksum = JSON.stringify(fields.map((item) => (item instanceof RegExp ? item.source : item)));

  const {
    formNavigation: { isSectionActive, registerSectionFields },
  } = useChecksterContext();

  useEffect(() => {
    registerSectionFields(sectionName, fieldsRef.current);
  }, [fieldsChecksum, registerSectionFields, sectionName, fieldsRef]);

  const isActive = isSectionActive(sectionName);

  if (!isActive) {
    return null;
  }

  return <>{children}</>;
}
