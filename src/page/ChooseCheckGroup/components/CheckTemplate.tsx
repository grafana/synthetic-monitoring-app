import React, { useState } from 'react';
import { trackCheckTemplateSelected } from 'features/tracking/checkTemplateEvents';

import { getUserPermissions } from 'data/permissions';
import { useIsOverlimit } from 'hooks/useIsOverlimit';

import { CheckTemplateCard } from './CheckTemplateCard';
import { CheckTemplateDefinition } from './checkTemplates';

export function CheckTemplate({ template }: { template: CheckTemplateDefinition }) {
  const [isOpen, setIsOpen] = useState(false);
  const isOverlimit = useIsOverlimit(false, template.checkType);
  const { canWriteChecks } = getUserPermissions();

  return (
    <>
      <CheckTemplateCard
        title={template.title}
        icon={template.icon}
        description={template.description}
        disabled={isOverlimit !== false || !canWriteChecks}
        onSelect={() => {
          trackCheckTemplateSelected({ check_template_id: template.id });
          setIsOpen(true);
        }}
      />
      {isOpen && <template.Drawer alerts={template.alerts} onClose={() => setIsOpen(false)} />}
    </>
  );
}
