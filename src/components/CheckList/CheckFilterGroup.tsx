import React, { useCallback, useEffect, useState } from 'react';

import { Button, Icon, Modal, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { CheckFiltersType } from 'types';

const groupStyles = (theme: GrafanaTheme2) => ({
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
      switch (key) {
        case 'labels':
          if (filters.labels.length > 0) {
            active += 1;
          }
          break;
        case 'search':
          break;
        case 'status':
          if (filters.status.value !== 0) {
            active += 1;
          }
          break;
        case 'probes':
          if (filters.probes.length > 0) {
            active += 1;
          }
          break;
        case 'type':
          if (filters.type !== 'all') {
            active += 1;
          }
          break;
      }
    });
    setActiveFilters(active);
  }, [filters]);

  const filterTitle = `Additional filters ${activeFilters > 0 ? `(${activeFilters} active)` : ''}`;

  return (
    <>
      <Button
        className={styles.marginRightSmall}
        variant={activeFilters > 0 ? 'primary' : 'secondary'}
        fill="outline"
        onClick={handleFilterOpen}
      >
        {filterTitle}
      </Button>
      <Modal title={filterTitle} isOpen={openFilters} onDismiss={handleFilterOpen}>
        <div>
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
      </Modal>
    </>
  );
};

export default CheckFilterGroup;
