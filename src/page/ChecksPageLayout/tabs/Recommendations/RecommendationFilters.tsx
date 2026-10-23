import React, { ReactNode, useId, useState } from 'react';
import { t, Trans } from '@grafana/i18n';
import { Button, Checkbox, Combobox, ComboboxOption, Icon, IconButton, useStyles2 } from '@grafana/ui';

import { CheckType } from 'types';

import { UNESCAPED } from './Recommendations.constants';
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
            <Button variant="secondary" fill="text" size="sm" onClick={() => onChange(NO_FILTERS)}>
              <Trans i18nKey="recommendations.filters.clearAll">Clear all</Trans>
            </Button>
          </>
        )}
      </div>
      <FilterGroup
        label={t('recommendations.filters.type', 'Type')}
        isOpenInitially
        selectedCount={selection.types.length}
        onClear={() => onChange({ ...selection, types: [] })}
      >
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
        <FilterGroup
          id={labelsId}
          label={t('recommendations.filters.labels', 'Labels')}
          isOpenInitially
          selectedCount={selection.labels.length}
          onClear={() => onChange({ ...selection, labels: [] })}
        >
          <ValuePicker
            labelledBy={labelsId}
            placeholder={getSearchLabel(labelOptions.length, 'labels')}
            options={labelOptions.map((label) => ({ value: label, label }))}
            selected={selection.labels}
            onChange={(labels) => onChange({ ...selection, labels })}
          />
        </FilterGroup>
      )}
      {folderOptions.length > 0 && (
        <FilterGroup
          id={foldersId}
          label={t('recommendations.filters.folders', 'Folders')}
          isOpenInitially
          selectedCount={selection.folders.length}
          onClear={() => onChange({ ...selection, folders: [] })}
        >
          <ValuePicker
            labelledBy={foldersId}
            placeholder={getSearchLabel(folderOptions.length, 'folders')}
            options={folderOptions}
            selected={selection.folders}
            onChange={(folders) => onChange({ ...selection, folders })}
          />
        </FilterGroup>
      )}
    </section>
  );
}

interface ValuePickerProps {
  labelledBy: string;
  placeholder: string;
  options: Array<ComboboxOption<string>>;
  selected: string[];
  onChange: (selected: string[]) => void;
}

// Every selection stays listed in full below the search, which only offers what is not picked yet.
function ValuePicker({ labelledBy, placeholder, options, selected, onChange }: ValuePickerProps) {
  const styles = useStyles2(getStyles);
  const [changeCount, setChangeCount] = useState(0);
  const getLabel = (value: string) => options.find((option) => option.value === value)?.label ?? value;

  const change = (next: string[]) => {
    setChangeCount(changeCount + 1);
    onChange(next);
  };

  return (
    <>
      {/* Combobox keeps a picked option's text in its input, so it is remounted after every change to
          start empty again. The change removed whatever had focus, so the new input takes it. */}
      <Combobox
        key={changeCount}
        autoFocus={changeCount > 0}
        aria-labelledby={labelledBy}
        placeholder={placeholder}
        options={options.filter(({ value }) => !selected.includes(value))}
        value={null}
        onChange={(option) => change([...selected, option.value])}
      />
      {selected.length > 0 && (
        <ul className={styles.selectedValues}>
          {selected.map((value) => (
            <li key={value} className={styles.selectedValue}>
              <span className={styles.selectedValueText}>{getLabel(value)}</span>
              <IconButton
                name="times"
                size="sm"
                aria-label={t('recommendations.filters.remove', 'Remove {{value}}', {
                  value: getLabel(value),
                  ...UNESCAPED,
                })}
                onClick={() => change(selected.filter((other) => other !== value))}
              />
            </li>
          ))}
        </ul>
      )}
    </>
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
  selectedCount: number;
  onClear: () => void;
  children: ReactNode;
}

function FilterGroup({ id, label, isOpenInitially = false, selectedCount, onClear, children }: FilterGroupProps) {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(isOpenInitially);

  return (
    <div>
      <div className={styles.filterGroupHeader}>
        <button id={id} className={styles.filterGroupToggle} onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
          <Icon name={isOpen ? 'angle-down' : 'angle-right'} size="sm" />
          {label}
        </button>
        {selectedCount > 0 && (
          <Button
            variant="secondary"
            fill="text"
            size="sm"
            aria-label={t('recommendations.filters.clearGroup', 'Clear {{group}} filters', { group: label })}
            onClick={onClear}
          >
            <Trans i18nKey="recommendations.filters.clear">Clear</Trans>
          </Button>
        )}
      </div>
      {isOpen && <div className={styles.filterGroupBody}>{children}</div>}
    </div>
  );
}
