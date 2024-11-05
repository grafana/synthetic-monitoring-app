import React, { useCallback } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Input, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Probe } from 'types';

export const PROBES_FILTER_ID = 'check-probes-filter';

export const ProbesFilter = ({ probes, onSearch }: { probes: Probe[]; onSearch: (probes: Probe[]) => void }) => {
  const styles = useStyles2(getStyles);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value.toLowerCase();

    const filteredProbes = probes.filter(
      (probe) =>
        probe.region.toLowerCase().includes(searchValue) ||
        probe.name.toLowerCase().includes(searchValue) ||
        probe.longRegion?.toLowerCase().includes(searchValue) ||
        probe.city?.toLowerCase().includes(searchValue) ||
        probe.provider?.toLowerCase().includes(searchValue) ||
        probe.country?.toLowerCase().includes(searchValue) ||
        probe.countryCode?.toLowerCase().includes(searchValue)
    );

    onSearch(filteredProbes);
  };

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  }, []);

  return (
    <div className={styles.searchInput}>
      <Input
        prefix={<Icon name="search" />}
        placeholder="Find a probe by city, country, region or provider"
        onChange={handleSearch}
        id={PROBES_FILTER_ID}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  searchInput: css({
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  }),
});
