import React from 'react';
import { OrgRole } from '@grafana/data';
import { SceneReactObject, SceneVariable, VariableValue } from '@grafana/scenes';
import { LinkButton } from '@grafana/ui';

import { Check, ROUTES } from 'types';
import { getCheckType, getCheckTypeGroup, hasRole } from 'utils';
import { useChecks } from 'data/useChecks';
import { getRoute } from 'components/Routing.utils';

interface Props {
  job: SceneVariable;
  instance: SceneVariable;
}

function EditCheckButton({ job, instance }: Props) {
  const { data: checks = [], isLoading } = useChecks();
  const url = getUrl(checks, instance.getValue(), job.getValue());

  return (
    <LinkButton variant="secondary" href={url} disabled={isLoading || !url || !hasRole(OrgRole.Editor)} icon={isLoading ? 'fa fa-spinner' : 'edit'}>
      Edit check
    </LinkButton>
  );
}

function getUrl(checks: Check[], target?: VariableValue | null, job?: VariableValue | null) {
  const check = checks.find((check) => check.target === target && check.job === job);

  if (!check) {
    return undefined;
  }

  const checkType = getCheckType(check.settings);
  const checkTypeGroup = getCheckTypeGroup(checkType);

  return `${getRoute(ROUTES.EditCheck)}/${checkTypeGroup}/${check.id}`;
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
