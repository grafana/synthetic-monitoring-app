import React, { useCallback, useRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, EmptySearchResult, Icon, Input, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export interface SearchFilterProps {
  onSearch: (value: string) => void;
  showEmptyState: boolean;
  emptyText?: string;
  placeholder?: string;
  id: string;
  value: string;
}

export const SearchFilter = ({
  onSearch,
  id,
  value,
  showEmptyState,
  emptyText = '',
  placeholder = '',
}: SearchFilterProps) => {
  const styles = useStyles2(getStyles);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  }, []);

  const onClearFilterClick = () => {
    onSearch('');
    inputRef.current?.focus();
  };

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {' '}
      <div className={styles.searchInput}>
        <Input
          ref={inputRef}
          prefix={<Icon name="search" />}
          suffix={
            value.length && (
              <Button fill="text" icon="times" size="sm" onClick={onClearFilterClick}>
                Clear
              </Button>
            )
          }
          value={value}
          placeholder={placeholder}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearch(event.target.value.toLowerCase())}
          id={id}
          onKeyDown={handleKeyDown}
        />
      </div>
      {showEmptyState && (
        <div className={styles.emptyState}>
          <EmptySearchResult>{emptyText}</EmptySearchResult>
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
