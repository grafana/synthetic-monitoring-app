import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import {
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
  sceneGraph,
} from '@grafana/scenes';
import { Button, Spinner, useStyles2 } from '@grafana/ui';
import { ChecksContext } from 'contexts/ChecksContext';
import React, { useContext, useEffect } from 'react';
import { Check } from 'types';

export interface MultiHttpStepsSceneState extends SceneObjectState {
  checkId?: number;
  check?: Check;
  checks?: Check[];
  target?: string;
  job?: string;
  stepUrl?: string;
}

export class MultiHttpStepsScene extends SceneObjectBase<MultiHttpStepsSceneState> {
  static Component = MultiHttpStepsSceneRenderer;
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['job', 'target', 'stepUrl'],
    onReferencedVariableValueChanged: () => {
      const { job, target, stepUrl } = this.state;
      const interpolatedInst = sceneGraph.interpolate(this, '${instance}');
      const interpolatedJob = sceneGraph.interpolate(this, '${job}');
      const interpolatedUrl = sceneGraph.interpolate(this, '${stepUrl}');
      if (interpolatedInst !== job || interpolatedInst !== target || interpolatedUrl !== stepUrl) {
        this.setState({ job: interpolatedJob, target: interpolatedInst, stepUrl: interpolatedUrl });
      }
    },
  });

  constructor({ job, target }: { job?: string; target?: string }) {
    super({ job: job ?? '', target: target ?? '' });
  }
}

export function MultiHttpStepsSceneRenderer({ model }: SceneComponentProps<MultiHttpStepsScene>) {
  const styles = useStyles2(getStyles);
  const { check } = model.useState();
  const { checks, loading } = useContext(ChecksContext);
  const interpolatedInst = sceneGraph.interpolate(model, '${instance}');
  const interpolatedJob = sceneGraph.interpolate(model, '${job}');

  useEffect(() => {
    if (interpolatedInst && interpolatedJob && !loading) {
      const check = checks.find((check) => {
        return check.job === interpolatedJob && check.target === interpolatedInst;
      });

      if (check) {
        model.setState({
          check,
          stepUrl: check.settings.multihttp?.entries[0].request.url,
        });
      }
    }
  }, [checks, loading, check, interpolatedJob, interpolatedInst, model]);

  if (!check) {
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
