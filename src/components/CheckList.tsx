// Libraries
import React, { FC, useState } from 'react';

// Types
import { OrgRole, Check, Label, GrafanaInstances } from 'types';
import {
  Button,
  IconButton,
  HorizontalGroup,
  Icon,
  VerticalGroup,
  Container,
  Select,
  Input,
  Pagination,
  InfoBox,
} from '@grafana/ui';
import { unEscapeStringFromRegex, escapeStringForRegex } from '@grafana/data';
import { getLocationSrv } from '@grafana/runtime';
import { CheckHealth } from 'components/CheckHealth';
import { UptimeGauge } from 'components/UptimeGauge';
import { hasRole, dashboardUID } from 'utils';
import { CHECK_FILTER_OPTIONS } from './constants';

const CHECKS_PER_PAGE = 15;

const matchesFilterType = (check: Check, typeFilter: string) => {
  if (typeFilter === 'all') {
    return true;
  }
  const checkType = Object.keys(check.settings)[0];
  if (checkType === typeFilter) {
    return true;
  }
  return false;
};

const matchesSearchFilter = (check: Check, searchFilter: string) => {
  if (!searchFilter) {
    return true;
  }

  // allow users to search using <term>=<somevalue>.
  // <term> can be one of target, job or a label name
  const lowerCaseFilter = searchFilter.toLowerCase().trim();
  if (lowerCaseFilter.split('=').length > 1) {
    const parts = lowerCaseFilter.split('=', 2);
    const term = parts[0] ?? '';
    const value = parts[1] ?? '';
    switch (term) {
      case 'target': {
        return check.target.toLowerCase().match(value);
      }
      case 'job': {
        return check.job.toLowerCase().match(value);
      }
      default: {
        for (let label of check.labels) {
          if (label.name === term && label.value.toLowerCase().match(value)) {
            return true;
          }
        }
      }
    }
    return false;
  }
  if (check.job.toLowerCase().match(lowerCaseFilter) || check.target.toLowerCase().match(lowerCaseFilter)) {
    return true;
  }
  for (let label of check.labels) {
    if (label.name.toLowerCase().match(searchFilter) || label.value.toLowerCase().match(searchFilter)) {
      return true;
    }
  }
  return false;
};

interface Props {
  instance: GrafanaInstances;
  onAddNewClick: () => void;
  checks: Check[];
}

export const CheckList: FC<Props> = ({ instance, onAddNewClick, checks }) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const datasource = instance.api.getMetricsDS();

  const showDashboard = (check: Check) => () => {
    const checkType = Object.keys(check.settings)[0];
    const target = dashboardUID(checkType, instance.api);

    if (!target) {
      console.log('dashboard not found.', checkType);
      return;
    }

    getLocationSrv().update({
      partial: false,
      path: `d/${target.uid}`,
      query: {
        'var-instance': check.target,
        'var-job': check.job,
      },
    });
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
          <Button variant="primary" onClick={onAddNewClick}>
            New Check
          </Button>
        )}
      </InfoBox>
    );
  }

  const filteredChecks = checks
    .filter(check => matchesFilterType(check, typeFilter) && matchesSearchFilter(check, searchFilter))
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
            onChange={event => setSearchFilter(escapeStringForRegex(event.currentTarget.value))}
            placeholder="search checks"
          />
        </div>
        <div className="gf-form">
          <label className="gf-form-label">Types</label>

          <div className="width-13">
            <Select
              options={CHECK_FILTER_OPTIONS}
              onChange={selected => setTypeFilter(selected?.value ?? typeFilter)}
              value={typeFilter}
            />
          </div>
        </div>
        <div className="page-action-bar__spacer" />
        {hasRole(OrgRole.EDITOR) && (
          <Button variant="secondary" onClick={onAddNewClick}>
            New Check
          </Button>
        )}
      </div>
      <section className="card-section card-list-layout-list">
        <ol className="card-list">
          {filteredChecks.map((check, index) => {
            const checkId: number = check.id || 0;
            if (!check.id) {
              return;
            }
            const checkType = Object.keys(check.settings)[0];
            return (
              <li className="card-item-wrapper" key={index}>
                <a
                  className="card-item"
                  onClick={() =>
                    getLocationSrv().update({
                      partial: true,
                      query: {
                        id: checkId,
                      },
                    })
                  }
                >
                  <HorizontalGroup justify="space-between">
                    <div className="card-item-body">
                      <figure className="card-item-figure">
                        <CheckHealth check={check} ds={datasource} />
                      </figure>
                      <VerticalGroup>
                        <div className="card-item-name">{check.target}</div>
                        <div className="card-item-sub-name">{check.job}</div>
                      </VerticalGroup>
                    </div>
                    <HorizontalGroup justify="flex-end">
                      <div className="card-item-header">
                        <div className="card-item-type">{checkType}</div>
                        {check.labels.map((label: Label) => (
                          <div>
                            <a onClick={() => setSearchFilter(`${label.name}=${label.value}`)}>
                              {label.name}={label.value}
                            </a>
                          </div>
                        ))}
                      </div>
                      <Container margin="lg">
                        <IconButton name="apps" size="xl" onClick={() => showDashboard(check)} />
                        {/* <a onClick={this.showDashboard(check)}>
                          <Icon name="apps" size="xl" />
                        </a> */}
                      </Container>
                      <UptimeGauge
                        labelNames={['instance', 'job']}
                        labelValues={[check.target, check.job]}
                        ds={datasource}
                        height={70}
                        width={150}
                        sparkline={false}
                      />
                    </HorizontalGroup>
                  </HorizontalGroup>
                </a>
              </li>
            );
          })}
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
