import React, { useCallback, useEffect, useState } from 'react';

import { Button, Icon, useStyles } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme } from '@grafana/data';
import { defaultFilters, CheckFilters } from './CheckList';

const groupStyles = (theme: GrafanaTheme) => ({
  container: css`
    position: relative;
  `,
  dropdown: css`
    position: absolute;
    background-color: rgb(24, 27, 31);
    border: 1px solid rgba(204, 204, 220, 0.15);
    border-radius: 2px;
    z-index: 100;
    padding: 20px;
    margin-top: 5px;
    -webkit-box-shadow: 5px 5px 14px -3px rgba(0, 0, 0, 0.67);
    box-shadow: 5px 5px 14px -3px rgba(0, 0, 0, 0.67);
    right: 8px;
    width: 500px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  `,
  horizontalGroup: css`
    margin-top: 20px;
    margin-bottom: 0px;
    display: flex;
    justify-content: flex-end;
    align-self: flex-end;
  `,
  marginRightSmall: css`
    margin-right: ${theme.spacing.sm};
  `,
});

interface Props {
  children: JSX.Element[] | JSX.Element;
  onReset: () => void;
  filters: CheckFilters;
}

const CheckFilterGroup = ({ children, onReset, filters }: Props) => {
  const [openFilters, setOpenFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const styles = useStyles(groupStyles);

  const handleFilterOpen = useCallback(() => {
    setOpenFilters(!openFilters);
  }, [openFilters]);

  useEffect(() => {
    let active = 0;
    // Count which filters have been applied
    Object.keys(filters).map((key) => {
      // Search filter is handled separately
      if (key !== 'search' && filters[key] !== defaultFilters[key]) {
        active += 1;
      }
    });
    setActiveFilters(active);
  }, [filters]);

  return (
    <div className={styles.container}>
      <Button
        className={styles.marginRightSmall}
        variant={activeFilters > 0 ? 'primary' : 'secondary'}
        fill="outline"
        onClick={handleFilterOpen}
      >
        Additional Filters {activeFilters > 0 ? `(${activeFilters} active)` : ''}{' '}
        <Icon name={openFilters ? 'angle-up' : 'angle-down'} size="lg" />
      </Button>
      {openFilters && (
        <div className={styles.dropdown}>
          {children}
          <div className={styles.horizontalGroup}>
            <Button variant="secondary" fill="text" onClick={onReset}>
              Reset
            </Button>
            <Button style={{ marginLeft: '10px' }} fill="text" variant="primary" onClick={() => setOpenFilters(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckFilterGroup;
