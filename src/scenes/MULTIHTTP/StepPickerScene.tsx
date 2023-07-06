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
      if (interpolatedInst !== job || interpolatedInst !== target) {
        this.setState({ job: interpolatedJob, target: interpolatedInst, stepUrl: '' });
      }
      if (interpolatedUrl !== stepUrl) {
        this.setState({ stepUrl: interpolatedUrl });
      }
    },
  });

  constructor({ job, target, stepUrl, $data }: MultiHttpStepsSceneState) {
    // console.log('initting', job, target, stepUrl);
    // const interpolatedInst = sceneGraph.interpolate(this, '${instance}');
    // const interpolatedJob = sceneGraph.interpolate(this, '${job}');
    // const interpolatedUrl = sceneGraph.interpolate(this, '${stepUrl}');
    // console.log('interpolated url', interpolatedUrl);
    super({ job: job ?? '', target: target ?? '', stepUrl, $data });
  }
}

export function MultiHttpStepsSceneRenderer({ model }: SceneComponentProps<MultiHttpStepsScene>) {
  const styles = useStyles2(getStyles);
  const { check, stepUrl } = model.useState();

  const { checks, loading } = useContext(ChecksContext);
  const interpolatedInst = sceneGraph.interpolate(model, '${instance}');
  const interpolatedJob = sceneGraph.interpolate(model, '${job}');
  const urlErrorRate = sceneGraph.getData(model).useState();

  const errorRateByUrl = useMemo(() => {
    const urls = urlErrorRate.data?.series?.[0]?.fields?.[1]?.values?.toArray();
    const errorRates = urlErrorRate.data?.series?.[0]?.fields?.[2]?.values?.toArray();

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
        console.log('in here gonna set url', interpolatedUrl);
        const useDefault =
          !interpolatedUrl || !check.settings.multihttp?.entries.find((entry) => entry.request.url === interpolatedUrl);
        model.setState({
          check,
          stepUrl: useDefault ? check.settings.multihttp?.entries[0].request.url : interpolatedUrl,
        });
      }
    }
  }, [checks, loading, check, interpolatedJob, interpolatedInst, model, stepUrl]);

  if (!check) {
    return <Spinner />;
  }

  return (
    <div className={styles.sidebar}>
      {check.settings.multihttp?.entries.map(({ request }, index) => {
        return (
          <StepPickerStepItem
            key={index}
            value={errorRateByUrl?.[request.url]}
            active={request.url === stepUrl}
            onClick={() => {
              model.setState({ stepUrl: request.url });
            }}
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
    margin: ${theme.spacing(2)};
    gap: ${theme.spacing(2)};
    max-width: 300px;
    max-height: 400px;
    overflow-y: auto;
    overflow-x: hidden;
  `,
});
