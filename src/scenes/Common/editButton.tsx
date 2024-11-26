import React from 'react';
import { SceneReactObject, SceneVariable, VariableValue } from '@grafana/scenes';
import { LinkButton } from '@grafana/ui';
import { generateRoutePath } from 'routes/utils';

import { Check, ROUTES } from 'types';
import { useChecks } from 'data/useChecks';
import { getUserPermissions } from 'data/permissions';

interface Props {
  job: SceneVariable;
  instance: SceneVariable;
}

function EditCheckButton({ job, instance }: Props) {
  const { data: checks = [], isLoading } = useChecks();
  const url = getUrl(checks, instance.getValue(), job.getValue());
  const { canWriteChecks } = getUserPermissions();

  return (
    <LinkButton
      variant="secondary"
      href={url}
      disabled={isLoading || !url || !canWriteChecks}
      icon={isLoading ? 'fa fa-spinner' : 'edit'}
    >
      Edit check
    </LinkButton>
  );
}

function getUrl(checks: Check[], target?: VariableValue | null, job?: VariableValue | null) {
  const check = checks.find((check) => check.target === target && check.job === job);

  if (!check) {
    return undefined;
  }

  return `${generateRoutePath(ROUTES.EditCheck, { id: check.id ?? 'new' })}`;
}

export function getEditButton({ job, instance }: Props) {
  return new SceneReactObject({
    component: EditCheckButton,
    props: {
      job,
      instance,
    },
  });
}
