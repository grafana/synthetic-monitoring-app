// Libraries
import React, { useState } from 'react';

// Types
import { OrgRole, Check, Label, GrafanaInstances } from 'types';
import { Button, Icon, Select, Input, Pagination, InfoBox } from '@grafana/ui';
import { unEscapeStringFromRegex, escapeStringForRegex } from '@grafana/data';
import { hasRole, checkType as getCheckType, matchStrings } from 'utils';
import { CHECK_FILTER_OPTIONS } from './constants';
import { CheckCard } from './CheckCard';

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

interface Props {
  instance: GrafanaInstances;
  onAddNewClick: () => void;
  checks: Check[];
}

export const CheckList = ({ instance, onAddNewClick, checks }: Props) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const handleLabelSelect = (label: Label) => {
    setSearchFilter(`${label.name}=${label.value}`);
    setCurrentPage(1);
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

  const filteredChecks = checks
    .filter(
      (check) => matchesFilterType(check, typeFilter) && matchesSearchFilter(check, searchFilter) && Boolean(check.id)
    )
    .sort((a, b) => b.job.localeCompare(a.job));

  const totalPages = Math.ceil(checks.length / CHECKS_PER_PAGE);

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
      <section className="card-section card-list-layout-list">
        <ol className="card-list">
          {filteredChecks
            .map((check, index) => <CheckCard check={check} key={index} onLabelSelect={handleLabelSelect} />)
            .slice((currentPage - 1) * CHECKS_PER_PAGE, currentPage * CHECKS_PER_PAGE)}
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
