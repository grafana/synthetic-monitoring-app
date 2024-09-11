import React, { useMemo } from 'react';
import { DataFrameView, GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { WebVitalName } from './types';
import { DataQueryExtended } from 'scenes/ExplorablePanel';

import { WebVitalGauge } from './WebVitalGauge';

interface WebVitalGaugeProps extends SceneObjectState {
  refId: string;
  name: string;
  longName: string;
  description?: string;
  exploreLink: string;
}

export class WebVitalGaugeScene extends SceneObjectBase<WebVitalGaugeProps> {
  static Component = WebVitalGaugeRenderer;
  constructor(state: WebVitalGaugeProps) {
    super({ ...state });
  }
}

function WebVitalGaugeRenderer({ model }: SceneComponentProps<WebVitalGaugeScene>) {
  const styles = useStyles2(getStyles);

  setExploreLink(model);

  const { data } = sceneGraph.getData(model).useState();
  const { name, description, longName, refId, exploreLink } = model.useState();
  const value = useMemo(() => {
    if (data != null && data.state === 'Done') {
      if (!data || data.series.length === 0) {
        return 0;
      }

      const frame = data.series.find((s) => s.refId === refId);

      if (!frame) {
        return 0;
      }

      const view = new DataFrameView(frame);

      return view.toArray()[0]?.Mean;
    }
  }, [data, refId]);

  return (
    <div className={styles}>
      <WebVitalGauge
        value={value}
        name={name as WebVitalName}
        description={description}
        longName={longName}
        exploreLink={exploreLink}
      />
    </div>
  );
}

function setExploreLink(model: WebVitalGaugeScene) {
  const data = sceneGraph.getData(model);
  const unsubscribable = data.subscribeToState((newDataState) => {
    let queries = (newDataState.data?.request?.targets ?? []) as DataQueryExtended[];
    queries = queries.map((q) => ({
      ...q,
      expr: sceneGraph.interpolate(model, q.expr),
    }));

    const datasource = queries.find((query) => !!query.datasource?.uid)?.datasource?.uid;

    if (datasource) {
      const { from, to } = sceneGraph.getTimeRange(model).state;

      const exploreLink = encodeURIComponent(
        JSON.stringify({
          datasource,
          queries,
          range: {
            from,
            to,
          },
        })
      );

      model.setState({ exploreLink });
    }
  });

  return () => unsubscribable.unsubscribe?.();
}

const getStyles = (theme: GrafanaTheme2) =>
  css({
    border: `1px solid ${theme.colors.border.weak}`,
    padding: '.5rem',
    width: '100%',
  });
