import React, { ReactNode, useId, useState } from 'react';
import { t, Trans } from '@grafana/i18n';
import { Checkbox, Icon, IconButton, useStyles2 } from '@grafana/ui';

import { CheckType } from 'types';

import { countSelected, FilterSelection, NO_FILTERS } from './Recommendations.filters';
import { getStyles } from './Recommendations.styles';

interface RecommendationFiltersProps {
  typeOptions: CheckType[];
  selection: FilterSelection;
  onChange: (selection: FilterSelection) => void;
}

export function RecommendationFilters({ typeOptions, selection, onChange }: RecommendationFiltersProps) {
  const styles = useStyles2(getStyles);
  const titleId = useId();
  const selectedCount = countSelected(selection);

  const toggleType = (type: CheckType) =>
    onChange({
      ...selection,
      types: selection.types.includes(type)
        ? selection.types.filter((selected) => selected !== type)
        : [...selection.types, type],
    });

  return (
    <section className={styles.filters} aria-labelledby={titleId}>
      <div className={styles.filtersHeader}>
        <span id={titleId} className={styles.filtersTitle}>
          <Trans i18nKey="recommendations.filters.title">Filters</Trans>
        </span>
        {selectedCount > 0 && (
          <>
            <span className={styles.mutedText}>
              {selectedCount === 1
                ? t('recommendations.filters.countSingle', '1 filter')
                : t('recommendations.filters.count', '{{filterCount}} filters', { filterCount: selectedCount })}
            </span>
            <IconButton
              name="times"
              size="sm"
              aria-label={t('recommendations.filters.clear', 'Clear filters')}
              onClick={() => onChange(NO_FILTERS)}
            />
          </>
        )}
      </div>
      <FilterGroup label={t('recommendations.filters.type', 'Type')} isOpenInitially>
        {typeOptions.map((type) => (
          <Checkbox
            key={type}
            label={type}
            value={selection.types.includes(type)}
            onChange={() => toggleType(type)}
            className={styles.filterOption}
          />
        ))}
      </FilterGroup>
    </section>
  );
}

interface FilterGroupProps {
  label: string;
  isOpenInitially?: boolean;
  children: ReactNode;
}

function FilterGroup({ label, isOpenInitially = false, children }: FilterGroupProps) {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(isOpenInitially);

  return (
    <div>
      <button className={styles.filterGroupToggle} onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        <Icon name={isOpen ? 'angle-down' : 'angle-right'} size="sm" />
        {label}
      </button>
      {isOpen && <div className={styles.filterGroupBody}>{children}</div>}
    </div>
  );
}
