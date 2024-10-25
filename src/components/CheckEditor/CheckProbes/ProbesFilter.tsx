import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Input, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Probe } from 'types';

export const ProbesFilter = ({ probes, onSearch }: { probes: Probe[]; onSearch: (probes: Probe[]) => void }) => {
  const styles = useStyles2(getStyles);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value.toLowerCase();

    const filteredProbes = probes.filter(
      (probe) => probe.region.toLowerCase().includes(searchValue) || probe.name.toLowerCase().includes(searchValue)
    );

    onSearch(filteredProbes);
  };

  return (
    <div className={styles.searchInput}>
      <Input prefix={<Icon name="search" />} placeholder="Find a probe by city or region" onChange={handleSearch} />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  searchInput: css({
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  }),
});
