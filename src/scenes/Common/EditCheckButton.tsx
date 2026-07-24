import React, { ComponentProps } from 'react';
import { LinkButton } from '@grafana/ui';

import { Check } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';

interface EditCheckButtonProps {
  id: Check['id'];
  size?: ComponentProps<typeof LinkButton>['size'];
  iconOnly?: boolean;
}

export const EditCheckButton = ({ id, size, iconOnly }: EditCheckButtonProps) => {
  const { canWriteChecks } = getUserPermissions();
  const url = id ? `${generateRoutePath(AppRoutes.EditCheck, { id })}` : undefined;

  const disabled = !url || !canWriteChecks;

  if (iconOnly) {
    return (
      <LinkButton
        aria-label="Edit check"
        tooltip="Edit check"
        variant="secondary"
        href={url}
        disabled={disabled}
        icon="edit"
        size={size}
      />
    );
  }

  return (
    <LinkButton variant="secondary" href={url} disabled={disabled} icon="edit" size={size}>
      Edit check
    </LinkButton>
  );
};
