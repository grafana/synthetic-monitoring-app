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
        expr: '{probe=~"$probe", instance="$instance", job="$job", probe_success=~"$probeSuccess"} | logfmt | __error__ = ""',
        refId: 'A',
      },
    ],
  });
}

export function getAllLogs(logs: DataSourceRef) {
  const unsuccessfulOnly = new CustomVariable({
    value: '.*',
    query: '.*',
    name: 'probeSuccess',
    hide: VariableHide.hideVariable,
  });
  const variables = new SceneVariableSet({
    variables: [unsuccessfulOnly],
  });

  const levelSwitch = new SceneReactObject({
    reactNode: (
      <InlineSwitch
        label="Unsuccessful runs only"
        transparent
        showLabel
        onChange={(e) => {
          if (e.currentTarget.checked) {
            unsuccessfulOnly.changeValueTo('0');
          } else {
            unsuccessfulOnly.changeValueTo('.*');
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
