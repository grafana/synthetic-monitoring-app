import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { VizConfigBuilders } from '@grafana/scenes';
import { QueryVariable, useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { VariableRefresh } from '@grafana/schema';
import { useStyles2 } from '@grafana/ui';

import { useMetricsDS } from 'hooks/useMetricsDS';

export const Summary = () => {
  const styles = useStyles2(getStyles);
  const metricsDS = useMetricsDS();

  const queries = [
    {
      expr: `
      (
        sum(
          rate(probe_all_duration_seconds_sum{probe=~"$probe"}[$__rate_interval])
          * on (instance, job, probe, config_version) group_left max(sm_check_info{check_name=~"$check_type", region=~"$region", $Filters})
          by (instance, job, probe, config_version)
        )
        by (job, instance)
      )
      /
      (
        sum(
          rate(probe_all_duration_seconds_count{probe=~"$probe"}[$__rate_interval])
          * on (instance, job, probe, config_version) group_left max(sm_check_info{check_name=~"$check_type", region=~"$region", $Filters})
          by (instance, job, probe, config_version)
        )
        by (job, instance)
      )
      `,
      hide: false,
      interval: '1m',
      legendFormat: '{{job}}/{{ instance }}',
      refId: 'A',
      uid: metricsDS?.uid,
    },
  ];

  const dataProvider = useQueryRunner({
    queries,
    cacheKey: [queries],
  });

  const plainGraph = VizConfigBuilders.timeseries().setCustomFieldConfig('fillOpacity', 6).build();

  return (
    <PluginPage>
      Summary page
      <div style={styles}>
        <QueryVariable
          name="check_type"
          label="check type"
          query={{ query: 'label_values(sm_check_info, check_name)', refId: 'A' }}
          datasource={{ uid: metricsDS?.uid }}
          regex={'.*'}
          includeAll={true}
        >
          <QueryVariable
            name="probe"
            isMulti={true}
            query={{ query: 'label_values(sm_check_info{},probe)', refId: 'A' }}
            refresh={VariableRefresh.onDashboardLoad}
            datasource={{ uid: metricsDS?.uid }}
            regex={'.*'}
            includeAll={true}
          >
            <QueryVariable
              name="region"
              query={{ query: 'label_values(sm_check_info{},region)', refId: 'A' }}
              datasource={{ uid: metricsDS?.uid }}
              regex={'.*'}
              includeAll={true}
            >
              <VizPanel title={`$check_type latency`} viz={plainGraph} dataProvider={dataProvider} />
            </QueryVariable>
          </QueryVariable>
        </QueryVariable>
      </div>
    </PluginPage>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  display: 'grid',
  flexGrow: 1,
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
  gridAutoRows: '320px',
  columnGap: `8px`,
  rowGap: `8px`,
});
