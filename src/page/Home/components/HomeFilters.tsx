import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { FilterPill, Icon, Input, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType } from 'types';

export interface HomeFiltersState {
  searchTerm: string;
  checkTypes: CheckType[];
}

interface HomeFiltersProps {
  availableTypes: CheckType[];
  filters: HomeFiltersState;
  onChange: (filters: HomeFiltersState) => void;
}

export const HomeFilters = ({ availableTypes, filters, onChange }: HomeFiltersProps) => {
  const styles = useStyles2(getStyles);

  const toggleType = (type: CheckType) => {
    const checkTypes = filters.checkTypes.includes(type)
      ? filters.checkTypes.filter((t) => t !== type)
      : [...filters.checkTypes, type];

    onChange({ ...filters, checkTypes });
  };

  return (
    <div className={styles.container}>
      <Input
        prefix={<Icon name="search" />}
        placeholder="Search by job or target"
        value={filters.searchTerm}
        onChange={(e) => onChange({ ...filters, searchTerm: e.currentTarget.value })}
        className={styles.search}
        aria-label="Search checks"
      />
      <div className={styles.pills}>
        {availableTypes.map((type) => (
          <FilterPill
            key={type}
            label={type}
            selected={filters.checkTypes.includes(type)}
            onClick={() => toggleType(type)}
          />
        ))}
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  }),
  search: css({
    maxWidth: '320px',
  }),
  pills: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
  }),
});
