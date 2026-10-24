import React from 'react';
import { dateTimeFormat } from '@grafana/data';

import { AdHocCheckState } from './types.adhoc-check';

import { Column } from '../../components/ui/Column';
import { LogsPanel } from './LogsPanel';

export function AdhocResultsList({ items }: { items: AdHocCheckState[] }) {
  return (
    <Column gap={1}>
      <h6>Test results</h6>
      {[...items].reverse().map((item) => (
        <Column gap={1} key={item.id}>
          <div>{dateTimeFormat(item.created)}</div>
          {Object.values(item.probeState).map((state) => (
            <LogsPanel
              key={state.name}
              timeseries={state.timeseries}
              logs={state.logs}
              probe={state.name}
              state={state.state}
              from="now-1h"
              to="now"
            />
          ))}
        </Column>
      ))}
    </Column>
  );
}
