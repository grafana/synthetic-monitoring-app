import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useSMDS } from 'hooks/useSMDS';

const viz = VizConfigBuilders.nodegraph().build();

export const NodeGraph = () => {
  const smDS = useSMDS();
  const styles = useStyles2(getStyles);
  const query = {
    instance: '$instance',
    probe: '$probe',
    job: '$job',
    queryType: 'traceroute',
    refId: 'A',
  };

  const dataProvider = useQueryRunner({
    queries: [query],
    datasource: smDS,
  });

  return (
    <div className={styles.nodeGraph}>
      <VizPanel
        dataProvider={dataProvider}
        description={`Shows all the routes a check takes to the destination`}
        title={`Traceroute path`}
        viz={viz}
      />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  nodeGraph: css({
    height: '500px',
  }),
});
