import React from 'react';
import { LinkButton } from '@grafana/ui';

import { Check } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';

interface EditCheckButtonProps {
  id: Check['id'];
}

export const EditCheckButton = ({ id }: EditCheckButtonProps) => {
  const { canWriteChecks } = getUserPermissions();
  const url = id ? `${generateRoutePath(AppRoutes.EditCheck, { id })}` : undefined;

  const disabled = !url || !canWriteChecks;

  return (
    <LinkButton variant="secondary" href={url} disabled={disabled} icon="edit">
      Edit check
    </LinkButton>
  );
};
