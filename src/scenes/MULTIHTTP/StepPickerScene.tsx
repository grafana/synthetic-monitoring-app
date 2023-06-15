import React, { useContext, useEffect } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, Spinner, useStyles2 } from '@grafana/ui';
import { InstanceContext } from 'contexts/InstanceContext';
import { Check } from 'types';

export interface MultiHttpStepsSceneState extends SceneObjectState {
  checkId: number;
  check?: Check;
  stepUrl?: string;
}

export class MultiHttpStepsScene extends SceneObjectBase<MultiHttpStepsSceneState> {
  static Component = MultiHttpStepsSceneRenderer;
}

export function MultiHttpStepsSceneRenderer({ model }: SceneComponentProps<MultiHttpStepsScene>) {
  const styles = useStyles2(getStyles);
  const { checkId, check } = model.useState();
  const { instance } = useContext(InstanceContext);
  useEffect(() => {
    if (!instance.api || check !== undefined) {
      return;
    }
    instance.api.getCheck(checkId).then((check) => {
      model.setState({ check, stepUrl: check.settings.multihttp?.entries[0].request.url });
    });
  }, [checkId, instance.api, check, model]);

  if (!check || !instance || !instance.metrics || !instance.logs || !instance.api) {
    return <Spinner />;
  }

  return (
    <div>
      <div className={styles.sidebar}>
        {check.settings.multihttp?.entries.map(({ request }, index) => {
          return (
            <Button
              key={index}
              variant={request.url === model.state.stepUrl ? 'primary' : 'secondary'}
              onClick={() => {
                model.setState({ stepUrl: request.url });
              }}
            >
              {request.url}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  layout: css`
    display: grid;
    grid-template-columns: auto 1fr;
  `,
  sidebar: css`
    display: flex;
    flex-direction: column;
    margin: ${theme.spacing(2)};
    gap: ${theme.spacing(2)};
    max-width: 300px;
  `,
});
