import React, { useCallback, useEffect, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Modal, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckEnabledStatus, CheckFiltersType } from 'types';
import { Trans } from 'components/i18n';

const groupStyles = (theme: GrafanaTheme2) => ({
  marginTop: css({
    marginTop: theme.spacing(3),
  }),
});

interface Props {
  children: JSX.Element[] | JSX.Element;
  onReset: () => void;
  filters: CheckFiltersType;
}

export const CheckFilterGroup = ({ children, onReset, filters }: Props) => {
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
          if (filters.status.value !== CheckEnabledStatus.All) {
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
      <Button variant={activeFilters > 0 ? 'primary' : 'secondary'} fill="outline" onClick={handleFilterOpen}>
        {filterTitle}
      </Button>
      <Modal title={filterTitle} isOpen={openFilters} onDismiss={handleFilterOpen}>
        <div>
          {children}
          <div className={styles.marginTop}>
            <Stack justifyContent={'flex-end'} alignItems={'flex-end'}>
              <Button variant="secondary" fill="text" onClick={onReset}>
                Reset
              </Button>
              <Button
                style={{ marginLeft: '10px' }}
                fill="text"
                variant="primary"
                onClick={() => setOpenFilters(false)}
              >
                <Trans i18nKey={'checks.filters.close'}>Close</Trans>
              </Button>
            </Stack>
          </div>
        </div>
      </Modal>
    </>
  );
};
