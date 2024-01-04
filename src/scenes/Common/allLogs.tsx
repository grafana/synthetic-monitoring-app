import React from 'react';
import { CustomVariable, SceneQueryRunner, SceneReactObject, SceneVariableSet } from '@grafana/scenes';
import { DataSourceRef, VariableHide } from '@grafana/schema';
import { InlineSwitch } from '@grafana/ui';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(logs: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: logs,
    queries: [
      {
        expr: '{probe=~"$probe", instance="$instance", job="$job"} | logfmt | __error__ = "" | level =~ "$errorLevel"',
        refId: 'A',
      },
    ],
  });
}

export function getAllLogs(logs: DataSourceRef) {
  const errorLevel = new CustomVariable({
    value: '.*',
    name: 'errorLevel',
    hide: VariableHide.hideVariable,
  });
  const variables = new SceneVariableSet({
    variables: [errorLevel],
  });

  const levelSwitch = new SceneReactObject({
    reactNode: (
      <InlineSwitch
        label="Errors only"
        transparent
        showLabel
        onChange={(e) => {
          if (e.currentTarget.checked) {
            errorLevel.changeValueTo('error');
            // switchState.setState({ value: true });
          } else {
            errorLevel.changeValueTo('.*');
          }
        }}
      />
    ),
  });

  const queryRunner = getQueryRunner(logs);

  const panel = new ExplorablePanel({
    pluginId: 'logs',
    title: `Logs`,
    $variables: variables,
    $data: queryRunner,
    headerActions: [levelSwitch],
    options: {
      showTime: true,
      showLabels: true,
      showCommonLabels: false,
      wrapLogMessage: true,
      prettifyLogMessage: true,
      enableLogDetails: true,
      dedupStrategy: 'none',
      sortOrder: 'Descending',
    },
  });

  return panel;
}
