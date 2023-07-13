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
  stepMethod?: string;
}

export class MultiHttpStepsScene extends SceneObjectBase<MultiHttpStepsSceneState> {
  static Component = MultiHttpStepsSceneRenderer;
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['job', 'target', 'stepUrl', 'stepMethod'],
    onReferencedVariableValueChanged: () => {
      const { job, target, stepUrl, stepMethod } = this.state;
      const interpolatedInst = sceneGraph.interpolate(this, '${instance}');
      const interpolatedJob = sceneGraph.interpolate(this, '${job}');
      const interpolatedUrl = sceneGraph.interpolate(this, '${stepUrl}');
      const interpolatedMethod = sceneGraph.interpolate(this, '${stepMethod}');
      if (interpolatedInst !== job || interpolatedInst !== target) {
        this.setState({ job: interpolatedJob, target: interpolatedInst });
      }
      if (interpolatedUrl && interpolatedUrl !== stepUrl) {
        this.setState({ stepUrl: interpolatedUrl });
      }
      if (interpolatedMethod && interpolatedMethod !== stepMethod) {
        this.setState({ stepMethod: interpolatedMethod });
      }
    },
  });

  constructor({ job, target, stepUrl, stepMethod, $data }: MultiHttpStepsSceneState) {
    super({ job: job ?? '', target: target ?? '', stepUrl, stepMethod, $data });
  }
}

export function MultiHttpStepsSceneRenderer({ model }: SceneComponentProps<MultiHttpStepsScene>) {
  const styles = useStyles2(getStyles);
  const { check, stepUrl, stepMethod } = model.useState();

  const { checks, loading } = useContext(ChecksContext);
  const interpolatedInst = sceneGraph.interpolate(model, '${instance}');
  const interpolatedJob = sceneGraph.interpolate(model, '${job}');
  const urlErrorRate = sceneGraph.getData(model).useState();

  const errorRateByUrl = useMemo(() => {
    const urls = urlErrorRate.data?.series?.[0]?.fields?.[1]?.values;
    const errorRates = urlErrorRate.data?.series?.[0]?.fields?.[2]?.values;

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
        const interpolatedUrl = sceneGraph.interpolate(model, '${stepUrl}');
        const interpolatedMethod = sceneGraph.interpolate(model, '${stepMethod}');
        const useDefault =
          !interpolatedUrl || !check.settings.multihttp?.entries.find((entry) => entry.request.url === interpolatedUrl);
        model.setState({
          check,
          stepUrl: useDefault ? check.settings.multihttp?.entries[0].request.url : interpolatedUrl,
          stepMethod: useDefault ? check.settings.multihttp?.entries[0].request.method : interpolatedMethod,
        });
      }
    }
  }, [checks, loading, check, interpolatedJob, interpolatedInst, model, stepUrl]);

  if (!check || !stepUrl) {
    return <Spinner />;
  }

  return (
    <div className={styles.sidebar}>
      {check.settings.multihttp?.entries.map(({ request }, index) => {
        return (
          <StepPickerStepItem
            key={index}
            value={errorRateByUrl?.[request.url]}
            active={request.url === stepUrl && request.method === stepMethod}
            onClick={() => {
              model.setState({ stepUrl: request.url, stepMethod: request.method });
            }}
            method={request.method}
            label={request.url}
          />
        );
      })}
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
    margin: ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(2)} 0;
    gap: ${theme.spacing(2)};
    max-width: 400px;
    max-height: 400px;
    overflow-y: auto;
    overflow-x: hidden;
  `,
});
