import React from 'react';
import { SceneReactObject, SceneVariable } from '@grafana/scenes';
import { Button, Spinner } from '@grafana/ui';

import { ROUTES } from 'types';
import { getCheckType } from 'utils';
import { useChecks } from 'data/useChecks';
import { useNavigation } from 'hooks/useNavigation';

interface Props {
  job: SceneVariable;
  instance: SceneVariable;
}

function EditCheckButton({ job, instance }: Props) {
  const { data: checks = [], isLoading } = useChecks();
  const navigate = useNavigation();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        const check = checks.find((check) => check.target === instance.getValue() && check.job === job.getValue());
        if (!check) {
          return;
        }
        const type = getCheckType(check.settings);
        navigate(`${ROUTES.EditCheck}/${type}/${check.id}`);
      }}
      disabled={isLoading || !checks}
    >
      {isLoading ? <Spinner /> : 'Edit check'}
    </Button>
  );
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
