import React from 'react';
import { Button } from '@grafana/ui';

import { useChecksterContext } from '../../contexts/ChecksterContext';

export function FormSectionNavigation() {
  const {
    formNavigation: { sectionOrder, setSectionActive, isSectionActive },
  } = useChecksterContext();
  return (
    <div>
      {sectionOrder.map((sectionName) => {
        return (
          <Button
            onClick={() => setSectionActive(sectionName)}
            variant={isSectionActive(sectionName) ? 'primary' : 'secondary'}
            key={sectionName}
          >
            {sectionName}
          </Button>
        );
      })}
    </div>
  );
}
