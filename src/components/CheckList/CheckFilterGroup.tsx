import React, { useCallback, useEffect, useState } from 'react';

import { Button, Icon, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { CheckFiltersType } from 'types';
import { defaultFilters } from 'components/CheckFilters';

const groupStyles = (theme: GrafanaTheme2) => ({
  container: css`
    position: relative;
  `,
  dropdown: css`
    position: absolute;
    background-color: ${theme.colors.background.primary};
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
    margin-right: ${theme.spacing(1)};
  `,
});

interface Props {
  children: JSX.Element[] | JSX.Element;
  onReset: () => void;
  filters: CheckFiltersType;
}

const CheckFilterGroup = ({ children, onReset, filters }: Props) => {
  const [openFilters, setOpenFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const styles = useStyles2(groupStyles);

  const handleFilterOpen = useCallback(() => {
    setOpenFilters(!openFilters);
  }, [openFilters]);

  useEffect(() => {
    let active = 0;
    // Count which filters have been applied
    Object.keys(filters).forEach((key) => {
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
