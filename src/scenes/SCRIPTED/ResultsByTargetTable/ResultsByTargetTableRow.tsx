import React, { useEffect } from 'react';
import { ExpanderComponentProps } from 'react-data-table-component';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneFlexLayout } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType } from 'types';

import { getExpectedResponse } from '../expectedResponse';
import { getDurationByTargetProbe } from './durationByTargetProbe';
import { getLatencyByPhaseTarget } from './latencyByPhaseTarget';
import { DataRow, ResultsByTargetTableSceneObject } from './ResultByTargetTable';
import { getSuccessRateByTargetProbe } from './successRateByTargetProbe';

function getResultsByTargetRowScene(metrics: DataSourceRef, labelValue: string, method: string, checkType: CheckType) {
  const labelName = checkType === CheckType.MULTI_HTTP ? 'url' : 'name';
  const flexItem = new SceneFlexLayout({
    direction: 'column',
    children: [
      new SceneFlexLayout({
        width: '100%',
        height: 250,
        children: [
          getSuccessRateByTargetProbe(metrics, labelName, labelValue, method),
          getExpectedResponse(metrics, labelName, labelValue, method),
        ],
      }),
      new SceneFlexLayout({
        width: '100%',
        height: 250,
        children: [
          getDurationByTargetProbe(metrics, labelName, labelValue, method),
          getLatencyByPhaseTarget(metrics, labelName, labelValue, method),
        ],
      }),
    ],
  });
  return flexItem;
}

interface Props extends ExpanderComponentProps<DataRow> {
  tableViz?: ResultsByTargetTableSceneObject;
  metrics?: DataSourceRef;
  checkType?: CheckType;
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      padding: theme.spacing(1),
      background: theme.colors.background.canvas,
    }),
  };
}

export function ResultsByTargetTableRow({ data, tableViz, metrics, checkType }: Props) {
  const { expandedRows } = tableViz?.useState() ?? {};
  const [rowKey, setRowKey] = React.useState<string | undefined>(undefined);
  const styles = useStyles2(getStyles);
  const rowScene = expandedRows?.find((scene) => scene.state.key === rowKey);

  useEffect(() => {
    if (!rowScene && metrics && tableViz && checkType) {
      const newRowScene = getResultsByTargetRowScene(metrics, data.name, data.method, checkType);
      setRowKey(newRowScene.state.key);
      tableViz.setState({ expandedRows: [...(tableViz.state.expandedRows ?? []), newRowScene] });
    }
  }, [data.name, data.method, tableViz, rowScene, metrics, checkType]);

  return <div className={styles.container}>{rowScene ? <rowScene.Component model={rowScene} /> : null}</div>;
}
