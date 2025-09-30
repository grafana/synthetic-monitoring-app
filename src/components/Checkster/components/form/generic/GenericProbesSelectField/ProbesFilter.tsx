import React, { useState } from 'react';

import { ProbeWithMetadata } from 'types';
import { SearchFilter } from 'components/SearchFilter';

export const PROBES_FILTER_ID = 'check-probes-filter';

export const ProbesFilter = ({
  probes,
  onSearch,
}: {
  probes: ProbeWithMetadata[];
  onSearch: (probes: ProbeWithMetadata[]) => void;
}) => {
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [filterText, setFilterText] = useState('');

  const handleSearch = (searchValue: string) => {
    setFilterText(searchValue);
    const filteredProbes = probes.filter(
      (probe) =>
        probe.region.toLowerCase().includes(searchValue) ||
        probe.name.toLowerCase().includes(searchValue) ||
        probe.displayName.toLowerCase().includes(searchValue) ||
        probe.longRegion.toLowerCase().includes(searchValue) ||
        probe.provider.toLowerCase().includes(searchValue) ||
        probe.country.toLowerCase().includes(searchValue) ||
        probe.countryCode.toLowerCase().includes(searchValue)
    );

    onSearch(filteredProbes);
    setShowEmptyState(filteredProbes.length === 0);
  };

  return (
    <>
      <SearchFilter
        onSearch={handleSearch}
        id={PROBES_FILTER_ID}
        value={filterText}
        showEmptyState={showEmptyState}
        emptyText="There are no probes matching your criteria."
        placeholder="Find a probe by city, country, region or provider"
      />
    </>
  );
};
