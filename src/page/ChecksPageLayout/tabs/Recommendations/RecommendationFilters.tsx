import React, { ReactNode, useId, useState } from 'react';
import { t, Trans } from '@grafana/i18n';
import { Checkbox, Icon, IconButton, MultiCombobox, useStyles2 } from '@grafana/ui';

import { CheckType } from 'types';

import { countSelected, FilterSelection, FolderOption, NO_FILTERS } from './Recommendations.filters';
import { getStyles } from './Recommendations.styles';

interface RecommendationFiltersProps {
  typeOptions: CheckType[];
  labelOptions: string[];
  folderOptions: FolderOption[];
  selection: FilterSelection;
  onChange: (selection: FilterSelection) => void;
}

export function RecommendationFilters({
  typeOptions,
  labelOptions,
  folderOptions,
  selection,
  onChange,
}: RecommendationFiltersProps) {
  const styles = useStyles2(getStyles);
  const titleId = useId();
  const labelsId = useId();
  const foldersId = useId();
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
      {labelOptions.length > 0 && (
        <FilterGroup id={labelsId} label={t('recommendations.filters.labels', 'Labels')} isOpenInitially>
          {/* MultiCombobox takes its name from aria-labelledby only; aria-label is dropped. */}
          <MultiCombobox
            aria-labelledby={labelsId}
            placeholder={getSearchLabel(labelOptions.length, 'labels')}
            options={labelOptions.map((label) => ({ label, value: label }))}
            value={selection.labels}
            onChange={(options) => onChange({ ...selection, labels: options.map(({ value }) => value) })}
          />
        </FilterGroup>
      )}
      {folderOptions.length > 0 && (
        <FilterGroup id={foldersId} label={t('recommendations.filters.folders', 'Folders')} isOpenInitially>
          <MultiCombobox
            aria-labelledby={foldersId}
            placeholder={getSearchLabel(folderOptions.length, 'folders')}
            options={folderOptions}
            value={selection.folders}
            onChange={(options) => onChange({ ...selection, folders: options.map(({ value }) => value) })}
          />
        </FilterGroup>
      )}
    </section>
  );
}

function getSearchLabel(optionCount: number, group: 'labels' | 'folders') {
  switch (group) {
    case 'labels':
      return optionCount === 1
        ? t('recommendations.filters.searchLabelsSingle', 'Search 1 label')
        : t('recommendations.filters.searchLabels', 'Search {{optionCount}} labels', { optionCount });
    case 'folders':
      return optionCount === 1
        ? t('recommendations.filters.searchFoldersSingle', 'Search 1 folder')
        : t('recommendations.filters.searchFolders', 'Search {{optionCount}} folders', { optionCount });
  }
}

interface FilterGroupProps {
  /** On the header, so a control in the group can be labelled by it. */
  id?: string;
  label: string;
  isOpenInitially?: boolean;
  children: ReactNode;
}

function FilterGroup({ id, label, isOpenInitially = false, children }: FilterGroupProps) {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(isOpenInitially);

  return (
    <div>
      <button id={id} className={styles.filterGroupToggle} onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        <Icon name={isOpen ? 'angle-down' : 'angle-right'} size="sm" />
        {label}
      </button>
      {isOpen && <div className={styles.filterGroupBody}>{children}</div>}
    </div>
  );
}
