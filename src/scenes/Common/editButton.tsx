import React from 'react';
import { SceneReactObject } from '@grafana/scenes';
import { LinkButton } from '@grafana/ui';

import { Check } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';

interface Props {
  id: Check['id'];
}

export function EditCheckButton({ id }: Props) {
  const { canWriteChecks } = getUserPermissions();
  const url = id ? `${generateRoutePath(AppRoutes.EditCheck, { id })}` : undefined;

  const disabled = !url || !canWriteChecks;

  return (
    <LinkButton variant="secondary" href={url} disabled={disabled} icon="edit">
      Edit check
    </LinkButton>
  );
}

export function getEditButton({ id }: Props) {
  return new SceneReactObject({
    component: EditCheckButton,
    props: {
      id,
    },
  });
}
