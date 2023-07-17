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
import { MultiHttpEntry } from 'components/MultiHttp/MultiHttpTypes';

export interface MultiHttpStepsSceneState extends SceneObjectState {
  checkId?: number;
  check?: Check;
  checks?: Check[];
  entries?: MultiHttpEntry[];
  duplicates?: Set<string>;
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
  const { check, stepUrl, stepMethod, entries, duplicates } = model.useState();

  const { checks, loading } = useContext(ChecksContext);
  const interpolatedInst = sceneGraph.interpolate(model, '${instance}');
  const interpolatedJob = sceneGraph.interpolate(model, '${job}');
  const urlErrorRate = sceneGraph.getData(model).useState();

  const errorRateByUrl = useMemo(() => {
    const methods = urlErrorRate.data?.series?.[0]?.fields?.[1]?.values;
    const urls = urlErrorRate.data?.series?.[0]?.fields?.[2]?.values;
    const errorRates = urlErrorRate.data?.series?.[0]?.fields?.[3]?.values;

    const errorRateByUrl = urls?.reduce((acc, url, index) => {
      const method = methods?.[index];
      acc[method + url] = errorRates?.[index];
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
        const deduplicatedEntries = check.settings.multihttp?.entries.reduce<{
          entries: MultiHttpEntry[];
          seen: Set<string>;
          duplicates: Set<string>;
        }>(
          (acc, entry) => {
            const requestKey = `${entry.request.method}${entry.request.url}`;
            if (acc.seen.has(requestKey)) {
              acc.duplicates.add(requestKey);
              return acc;
            }
            if (!acc.seen.has(requestKey)) {
              acc.seen.add(requestKey);
              acc.entries.push(entry);
            }
            return acc;
          },
          {
            entries: [],
            seen: new Set(),
            duplicates: new Set(),
          }
        );

        model.setState({
          check,
          entries: deduplicatedEntries?.entries,
          duplicates: deduplicatedEntries?.duplicates,
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
      {entries?.map(({ request }, index) => {
        const isAggregated = Boolean(duplicates?.has(`${request.method}${request.url}`));

        return (
          <StepPickerStepItem
            key={index}
            value={errorRateByUrl?.[request.method + request.url]}
            active={request.url === stepUrl && request.method === stepMethod}
            onClick={() => {
              model.setState({ stepUrl: request.url, stepMethod: request.method });
            }}
            method={request.method}
            label={request.url}
            isAggregated={isAggregated}
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
