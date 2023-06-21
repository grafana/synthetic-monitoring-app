import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import {
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
  sceneGraph,
} from '@grafana/scenes';
import { Spinner, useStyles2 } from '@grafana/ui';
import { ChecksContext } from 'contexts/ChecksContext';
import React, { useContext, useEffect, useMemo } from 'react';
import { Check } from 'types';
import { StepPickerStepItem } from './StepPickerStepItem';

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

  constructor({ job, target, $data }: MultiHttpStepsSceneState) {
    super({ job: job ?? '', target: target ?? '', $data });
  }
}

export function MultiHttpStepsSceneRenderer({ model }: SceneComponentProps<MultiHttpStepsScene>) {
  const styles = useStyles2(getStyles);
  const { check } = model.useState();

  const { checks, loading } = useContext(ChecksContext);
  const interpolatedInst = sceneGraph.interpolate(model, '${instance}');
  const interpolatedJob = sceneGraph.interpolate(model, '${job}');
  const urlErrorRate = sceneGraph.getData(model).useState();

  const errorRateByUrl = useMemo(() => {
    const urls = urlErrorRate.data?.series[0].fields[1].values.toArray();
    const errorRates = urlErrorRate.data?.series[0].fields[2].values.toArray();

    const errorRateByUrl = urls?.reduce((acc, url, index) => {
      acc[url] = errorRates?.[index];
      return acc;
    }, {});
    return errorRateByUrl;
  }, [urlErrorRate]);

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
            <StepPickerStepItem
              key={index}
              value={errorRateByUrl?.[request.url]}
              onClick={() => {
                model.setState({ stepUrl: request.url });
              }}
            >
              {request.url}
            </StepPickerStepItem>
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
