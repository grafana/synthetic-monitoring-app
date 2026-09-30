import React, { useState } from 'react';
import { trackCheckTemplateSelected } from 'features/tracking/checkTemplateEvents';

import { getUserPermissions } from 'data/permissions';
import { CHECK_TYPE_OPTIONS } from 'hooks/useCheckTypeOptions.constants';
import { useIsOverlimit } from 'hooks/useIsOverlimit';

import { CheckTemplateCard } from './CheckTemplateCard';
import { CheckTemplateDefinition } from './checkTemplates';

export function CheckTemplate({ template }: { template: CheckTemplateDefinition }) {
  const [isOpen, setIsOpen] = useState(false);
  const isOverlimit = useIsOverlimit(false, template.checkType);
  const { canWriteChecks } = getUserPermissions();
  const checkTypeOption = CHECK_TYPE_OPTIONS.find((option) => option.value === template.checkType)!;

  return (
    <>
      <CheckTemplateCard
        title={template.title}
        icon={template.icon}
        description={template.description}
        checkType={checkTypeOption.label}
        disabled={isOverlimit !== false || !canWriteChecks}
        onSelect={() => {
          trackCheckTemplateSelected({ check_template_id: template.id });
          setIsOpen(true);
        }}
      />
      {isOpen && <template.Drawer onClose={() => setIsOpen(false)} />}
    </>
  );
}
