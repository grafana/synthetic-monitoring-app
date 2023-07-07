import { SceneReactObject, SceneVariable } from '@grafana/scenes';
import { Button, Spinner } from '@grafana/ui';
import { ChecksContext } from 'contexts/ChecksContext';
import { useNavigation } from 'hooks/useNavigation';
import React, { useContext } from 'react';
import { ROUTES } from 'types';
import { checkType } from 'utils';

interface Props {
  job: SceneVariable;
  instance: SceneVariable;
}

function EditCheckButton({ job, instance }: Props) {
  const { checks, loading } = useContext(ChecksContext);
  const navigate = useNavigation();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        const check = checks.find((check) => check.target === instance.getValue() && check.job === job.getValue());
        if (!check) {
          return;
        }
        const type = checkType(check.settings);
        navigate(`${ROUTES.EditCheck}/${type}/${check.id}`);
      }}
      disabled={loading || !checks}
    >
      {loading ? <Spinner /> : 'Edit check'}
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
