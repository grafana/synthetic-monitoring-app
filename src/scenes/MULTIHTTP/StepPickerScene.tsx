import React, { useContext, useEffect, useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import {
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
} from '@grafana/scenes';
import { Spinner, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { ChecksContext } from 'contexts/ChecksContext';
import { MultiHttpEntry, QueryParams } from 'components/MultiHttp/MultiHttpTypes';

import { StepPickerStepItem } from './StepPickerStepItem';

export interface MultiHttpStepsSceneState extends SceneObjectState {
  checkId?: number;
  check?: Check;
  checks?: Check[];
  entries?: MultiHttpEntry[];
  duplicates?: Set<string>;
  target?: string;
  job?: string;
  stepUrl?: string;
  activeStepIndex?: string;
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

function getUrl(url: string, queryParams?: QueryParams[]) {
  if (!queryParams) {
    return url;
  }
  const queryString = queryParams?.map(({ name, value }) => `${name}=${value}`).join('&') ?? '';
  return url + '?' + queryString;
}

export function MultiHttpStepsSceneRenderer({ model }: SceneComponentProps<MultiHttpStepsScene>) {
  const styles = useStyles2(getStyles);
  const { check, activeStepIndex, stepUrl, stepMethod, entries, duplicates } = model.useState();

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
        const interpolatedStepIndex = sceneGraph.interpolate(model, '${activeStepIndex}');
        const interpolatedMethod = sceneGraph.interpolate(model, '${stepMethod}');
        const useDefault =
          !interpolatedStepIndex || check.job !== model.state.check?.job || check.target !== model.state.check?.target;
        const deduplicatedEntries = check.settings.multihttp?.entries.reduce<{
          entries: MultiHttpEntry[];
          seen: Set<string>;
          duplicates: Set<string>;
        }>(
          (acc, entry) => {
            const url = getUrl(entry.request.url, entry.request.queryFields);
            const requestKey = `${entry.request.method}${url}`;
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

        const stepIndex = useDefault ? '0' : interpolatedStepIndex;
        const defaultUrl = check.settings.multihttp?.entries?.[parseInt(stepIndex, 10)]?.request.url;
        model.setState({
          check,
          entries: deduplicatedEntries?.entries,
          duplicates: deduplicatedEntries?.duplicates,
          stepUrl: useDefault ? defaultUrl : interpolatedUrl,
          activeStepIndex: stepIndex,
          stepMethod: !interpolatedUrl ? check.settings.multihttp?.entries[0].request.method : interpolatedMethod,
        });
      }
    }
  }, [checks, loading, check, interpolatedJob, interpolatedInst, model, stepUrl]);

  if (!check || !stepUrl || !activeStepIndex) {
    return <Spinner />;
  }

  return (
    <div className={styles.sidebar}>
      {entries?.map(({ request }, index) => {
        const url = getUrl(request.url, request.queryFields);
        const isAggregated = Boolean(duplicates?.has(`${request.method}${url}`));

        return (
          <StepPickerStepItem
            key={index}
            value={errorRateByUrl?.[String(index)]}
            active={String(index) === activeStepIndex && request.method === stepMethod}
            onClick={() => {
              model.setState({ stepUrl: url, activeStepIndex: String(index), stepMethod: request.method });
            }}
            method={request.method}
            label={url}
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
