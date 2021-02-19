// Libraries
import React, { useState, ChangeEvent } from 'react';

// Types
import { OrgRole, Check, Label, GrafanaInstances, FilteredCheck } from 'types';
import { Button, Icon, Select, Input, Pagination, InfoBox, Checkbox, ButtonGroup, useStyles } from '@grafana/ui';
import { unEscapeStringFromRegex, escapeStringForRegex, GrafanaTheme } from '@grafana/data';
import { hasRole, checkType as getCheckType, matchStrings } from 'utils';
import { CHECK_FILTER_OPTIONS } from './constants';
import { CheckCard } from './CheckCard';
import { css } from 'emotion';

const CHECKS_PER_PAGE = 15;

const matchesFilterType = (check: Check, typeFilter: string) => {
  if (typeFilter === 'all') {
    return true;
  }
  const checkType = getCheckType(check.settings);
  if (checkType === typeFilter) {
    return true;
  }
  return false;
};

const matchesSearchFilter = ({ target, job, labels }: Check, searchFilter: string) => {
  if (!searchFilter) {
    return true;
  }

  // allow users to search using <term>=<somevalue>.
  // <term> can be one of target, job or a label name
  const filterParts = searchFilter.toLowerCase().trim().split('=');

  const labelMatches = labels.reduce((acc, { name, value }) => {
    acc.push(name);
    acc.push(value);
    return acc;
  }, [] as string[]);

  return filterParts.some((filterPart) => matchStrings(filterPart, [target, job, ...labelMatches]));
};

const getStyles = (theme: GrafanaTheme) => ({
  bulkActionContainer: css`
    padding: ${theme.spacing.sm};
    margin-bottom: ${theme.spacing.sm};
    display: flex;
    min-height: 48px;
    align-items: center;
  `,
  buttonGroup: css`
    display: flex;
    align-items: center;
  `,
  checkboxContainer: css`
    margin-right: ${theme.spacing.sm};
    height: 45px;
  `,
  checkbox: css`
    position: relative;
  `,
  marginRightSmall: css`
    margin-right: ${theme.spacing.sm};
  `,
});

interface Props {
  instance: GrafanaInstances;
  onAddNewClick: () => void;
  checks: Check[];
}

export const CheckList = ({ instance, onAddNewClick, checks }: Props) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedChecks, setSelectedChecks] = useState<Set<number>>(new Set());
  const styles = useStyles(getStyles);

  const totalPages = Math.ceil(checks.length / CHECKS_PER_PAGE);
  const filteredChecks = checks
    .filter(
      (check) => matchesFilterType(check, typeFilter) && matchesSearchFilter(check, searchFilter) && Boolean(check.id)
    )
    .sort((a, b) => b.job.localeCompare(a.job)) as FilteredCheck[];

  const handleLabelSelect = (label: Label) => {
    setSearchFilter(`${label.name}=${label.value}`);
    setCurrentPage(1);
  };

  const currentPageChecks = filteredChecks.slice((currentPage - 1) * CHECKS_PER_PAGE, currentPage * CHECKS_PER_PAGE);

  const toggleVisibleCheckSelection = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedChecks(new Set(currentPageChecks.map((check) => check.id)));
      return;
    }
    clearSelectedChecks();
  };

  const toggleAllCheckSelection = () => {
    setSelectedChecks(new Set(filteredChecks.map((check) => check.id)));
  };

  const clearSelectedChecks = () => {
    setSelectedChecks(new Set());
  };

  const handleCheckSelect = (checkId: number) => {
    if (!selectedChecks.has(checkId)) {
      console.log('adding to', selectedChecks);
      setSelectedChecks(new Set(selectedChecks.add(checkId)));
      return;
    }
    selectedChecks.delete(checkId);
    console.log('deleted from', selectedChecks);
    setSelectedChecks(new Set(selectedChecks));
  };

  if (!checks) {
    return null;
  }

  if (checks.length === 0) {
    return (
      <InfoBox
        title="Grafana Cloud Synthetic Monitoring"
        url={'https://grafana.com/docs/grafana-cloud/synthetic-monitoring/'}
      >
        <p>
          This account does not currently have any checks configured. Click the button below to start monitoring your
          services with Grafana Cloud.
        </p>
        {hasRole(OrgRole.EDITOR) && (
          <Button variant="primary" onClick={onAddNewClick} type="button">
            New Check
          </Button>
        )}
      </InfoBox>
    );
  }

  return (
    <div>
      <div className="page-action-bar">
        <div className="gf-form gf-form--grow">
          <Input
            // Replaces the usage of ref
            autoFocus
            prefix={<Icon name="search" />}
            width={40}
            type="text"
            value={searchFilter ? unEscapeStringFromRegex(searchFilter) : ''}
            onChange={(event) => setSearchFilter(escapeStringForRegex(event.currentTarget.value))}
            placeholder="search checks"
          />
        </div>
        <div className="gf-form">
          <label className="gf-form-label">Types</label>

          <div className="width-13">
            <Select
              aria-label="Types"
              options={CHECK_FILTER_OPTIONS}
              onChange={(selected) => setTypeFilter(selected?.value ?? typeFilter)}
              value={typeFilter}
            />
          </div>
        </div>
        <div className="page-action-bar__spacer" />
        {hasRole(OrgRole.EDITOR) && (
          <Button variant="secondary" onClick={onAddNewClick} type="button">
            New Check
          </Button>
        )}
      </div>
      <div className={styles.bulkActionContainer}>
        <div className={styles.checkboxContainer}>
          <Checkbox onChange={toggleVisibleCheckSelection} className={styles.checkbox} />
        </div>
        {selectedChecks.size > 0 && (
          <>
            <span className={styles.marginRightSmall}>{selectedChecks.size} checks are selected.</span>
            <div className={styles.buttonGroup}>
              {selectedChecks.size < filteredChecks.length && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className={styles.marginRightSmall}
                  onClick={toggleAllCheckSelection}
                >
                  Select all {filteredChecks.length} checks
                </Button>
              )}
              <Button type="button" variant="destructive" className={styles.marginRightSmall}>
                Delete
              </Button>
              <Button type="button" variant="secondary">
                Disable
              </Button>
            </div>
          </>
        )}
      </div>
      <section className="card-section card-list-layout-list">
        <ol className="card-list">
          {currentPageChecks.map((check, index) => (
            <CheckCard
              check={check}
              key={index}
              onLabelSelect={handleLabelSelect}
              onToggleCheckbox={handleCheckSelect}
              selected={selectedChecks.has(check.id)}
            />
          ))}
        </ol>
      </section>
      {totalPages > 1 && (
        <Pagination
          numberOfPages={totalPages}
          currentPage={currentPage}
          onNavigate={(toPage: number) => setCurrentPage(toPage)}
        />
      )}
    </div>
  );
};
