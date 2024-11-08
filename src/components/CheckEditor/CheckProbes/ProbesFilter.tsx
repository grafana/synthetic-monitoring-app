import React, { useCallback, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, EmptySearchResult, Icon, Input, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Probe } from 'types';

export const PROBES_FILTER_ID = 'check-probes-filter';

export const ProbesFilter = ({ probes, onSearch }: { probes: Probe[]; onSearch: (probes: Probe[]) => void }) => {
  const styles = useStyles2(getStyles);

  const [showEmptyState, setShowEmptyState] = useState(false);
  const [filterText, setFilterText] = useState('');

  const handleSearch = (searchValue: string) => {
    setFilterText(searchValue);

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
    setShowEmptyState(filteredProbes.length === 0);
  };

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  }, []);

  const onClearFilterClick = () => {
    setFilterText('');
    handleSearch('');
    inputRef.current?.focus();
  };

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className={styles.searchInput}>
        <Input
          ref={inputRef}
          prefix={<Icon name="search" />}
          suffix={
            filterText.length && (
              <Button fill="text" icon="times" size="sm" onClick={onClearFilterClick}>
                Clear
              </Button>
            )
          }
          value={filterText}
          placeholder="Find a probe by city, country, region or provider"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleSearch(event.target.value.toLowerCase())}
          id={PROBES_FILTER_ID}
          onKeyDown={handleKeyDown}
        />
      </div>

      {showEmptyState && (
        <div className={styles.emptyState}>
          <EmptySearchResult>There are no probes matching your criteria.</EmptySearchResult>
        </div>
      )}
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  searchInput: css({
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  }),
  emptyState: css({
    marginTop: theme.spacing(2),
  }),
});
