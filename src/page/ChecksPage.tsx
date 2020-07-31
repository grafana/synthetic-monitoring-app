// Libraries
import React, { PureComponent } from 'react';

// Types
import { Check, GrafanaInstances, Label, IpVersion, OrgRole, CheckType } from 'types';
import { getLocationSrv } from '@grafana/runtime';
import {
  Button,
  HorizontalGroup,
  Icon,
  VerticalGroup,
  Container,
  Select,
  Input,
  Pagination,
  InfoBox,
} from '@grafana/ui';
import { SelectableValue, unEscapeStringFromRegex, escapeStringForRegex } from '@grafana/data';
import { CheckEditor } from 'components/CheckEditor';
import { UptimeGauge, CheckHealth } from 'components/UptimeGauge';
import { hasRole, dashboardUID } from 'utils';

interface Props {
  instance: GrafanaInstances;
  id?: string;
  checksPerPage?: number;
}

interface State {
  checks: Check[];
  filteredChecks: Check[];
  check?: Check; // selected check
  addNew: boolean;
  typeFilter: string;
  searchFilter: string;
  totalPages: number;
  currentPage: number;
  checksPerPage: number;
  loading: boolean;
}

export class ChecksPage extends PureComponent<Props, State> {
  state: State = {
    checks: [],
    filteredChecks: [],
    addNew: false,
    typeFilter: 'all',
    searchFilter: '',
    totalPages: 1,
    currentPage: 1,
    checksPerPage: this.props.checksPerPage || 15,
    loading: true,
  };

  async componentDidMount() {
    const { instance, id } = this.props;
    const { checksPerPage } = this.state;
    const checks = await instance.api.listChecks();
    const sortedChecks = checks.sort((a, b) => b.job.localeCompare(a.job));
    const totalPages = Math.ceil(sortedChecks.length / checksPerPage);
    const num = id ? parseInt(id, 10) : -1;
    const check = checks.find(c => c.id === num);
    this.setState({
      checks: sortedChecks,
      check: check,
      totalPages: totalPages,
      filteredChecks: sortedChecks.slice(0, checksPerPage),
      loading: false,
    });
  }

  componentDidUpdate(oldProps: Props) {
    if (this.props.id !== oldProps.id) {
      const { id } = this.props;
      const num = id ? parseInt(id, 10) : -1;
      const check = this.state.checks.find(c => c.id === num);
      this.setState({ check });
    }
  }

  //-----------------------------------------------------------------
  // CHECK List
  //-----------------------------------------------------------------

  onSelectCheck = (id: number) => {
    getLocationSrv().update({
      partial: true,
      query: {
        id,
      },
    });
  };

  formatLabels(labels: Label[]) {
    return labels.map(label => {
      return (
        <div>
          <a onClick={this.onFilterByLabel(label.name, label.value)}>
            {label.name}={label.value}
          </a>
        </div>
      );
    });
  }

  filterChecks() {
    const { typeFilter, searchFilter, currentPage, checks, checksPerPage } = this.state;
    let filtered = checks
      .filter(a => {
        if (typeFilter === 'all') {
          return true;
        }
        const checkType = Object.keys(a.settings)[0];
        if (checkType === typeFilter) {
          return true;
        }
        return false;
      })
      .filter(a => {
        if (!searchFilter) {
          return true;
        }

        // allow users to search using <term>=<somevalue>.
        // <term> can be one of target, job or a label name
        if (searchFilter.split('=').length > 1) {
          let parts = searchFilter.split('=', 2);
          let term = parts[0];
          let value = parts[1];
          switch (term) {
            case 'target': {
              return a.target.match(value);
            }
            case 'job': {
              return a.job.match(value);
            }
            default: {
              for (let label of a.labels) {
                if (label.name === term && label.value.match(value)) {
                  return true;
                }
              }
            }
          }
          return false;
        }
        if (a.job.match(searchFilter) || a.target.match(searchFilter)) {
          return true;
        }
        for (let label of a.labels) {
          if (label.name.match(searchFilter) || label.value.match(searchFilter)) {
            return true;
          }
        }
        return false;
      });

    let totalPages = Math.ceil(filtered.length / checksPerPage);
    this.setState({
      totalPages: totalPages,
      filteredChecks: filtered.slice(checksPerPage * (currentPage - 1), currentPage * checksPerPage),
    });
  }

  showDashboard = (check: Check) => (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.stopPropagation();
    const { instance } = this.props;
    const checkType = Object.keys(check.settings)[0];
    const target = dashboardUID(checkType, instance.api);

    if (!target) {
      console.log('dashboard not found.', checkType);
      return;
    }

    const d = `d/${target.uid}`;
    let q = {
      'var-instance': check.target,
      'var-job': check.job,
    };

    getLocationSrv().update({
      partial: false,
      path: d,
      query: q,
    });
  };

  onTypeFilterChanged = (type: SelectableValue<string>) => {
    if (!type.value) {
      return;
    }
    this.setState({ typeFilter: type.value, currentPage: 1 }, this.filterChecks);
  };

  onFilterByLabel = (labelName: string, labelValue: string) => (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.stopPropagation();
    this.setState({ searchFilter: `${labelName}=${labelValue}`, currentPage: 1 }, this.filterChecks);
  };

  onSearchFilterChange = (filter: string) => {
    this.setState({ searchFilter: filter }, this.filterChecks);
  };

  changePage = (toPage: number) => {
    this.setState({ currentPage: toPage }, this.filterChecks);
  };

  renderNoChecks() {
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
          <Button variant="primary" onClick={this.onAddNew}>
            New Check
          </Button>
        )}
      </InfoBox>
    );
  }

  renderCheckList() {
    const { checks, typeFilter, searchFilter, filteredChecks, totalPages, currentPage } = this.state;
    const { instance } = this.props;
    if (!checks) {
      return null;
    }

    if (checks.length === 0) {
      return this.renderNoChecks();
    }

    const checkTypes = [
      {
        label: 'All',
        value: 'all',
      },
      {
        label: 'HTTP',
        value: CheckType.HTTP,
      },
      {
        label: 'PING',
        value: CheckType.PING,
      },
      {
        label: 'DNS',
        value: CheckType.DNS,
      },
      {
        label: 'TCP',
        value: CheckType.TCP,
      },
    ];
    const ds = instance.api.getMetricsDS();
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
              onChange={event => this.onSearchFilterChange(escapeStringForRegex(event.currentTarget.value))}
              placeholder="search checks"
            />
          </div>
          <div className="gf-form">
            <label className="gf-form-label">Types</label>

            <div className="width-13">
              <Select options={checkTypes} onChange={this.onTypeFilterChanged} value={typeFilter} />
            </div>
          </div>
          <div className="page-action-bar__spacer" />
          {hasRole(OrgRole.EDITOR) && (
            <Button variant="secondary" onClick={this.onAddNew}>
              New Check
            </Button>
          )}
        </div>
        <section className="card-section card-list-layout-list">
          <ol className="card-list">
            {filteredChecks.map(check => {
              const checkId: number = check.id || 0;
              if (!check.id) {
                return;
              }
              const checkType = Object.keys(check.settings)[0];
              return (
                <li className="card-item-wrapper">
                  <a className="card-item" onClick={() => this.onSelectCheck(checkId)}>
                    <HorizontalGroup justify="space-between">
                      <div className="card-item-body">
                        <figure className="card-item-figure">
                          <CheckHealth check={check} ds={ds} />
                        </figure>
                        <VerticalGroup>
                          <div className="card-item-name">{check.target}</div>
                          <div className="card-item-sub-name">{check.job}</div>
                        </VerticalGroup>
                      </div>
                      <HorizontalGroup justify="flex-end">
                        <div className="card-item-header">
                          <div className="card-item-type">{checkType}</div>
                          {this.formatLabels(check.labels)}
                        </div>
                        <Container margin="lg">
                          <a onClick={this.showDashboard(check)}>
                            <Icon name="apps" size="xl" />
                          </a>
                        </Container>
                        <UptimeGauge
                          labelNames={['instance', 'job']}
                          labelValues={[check.target, check.job]}
                          ds={ds}
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
          <Pagination numberOfPages={totalPages} currentPage={currentPage} onNavigate={this.changePage} />
        )}
      </div>
    );
  }

  onAddNew = () => {
    this.setState({
      addNew: true,
    });
  };

  onRefresh = async () => {
    const { instance } = this.props;
    const checks = await instance.api.listChecks();
    const sortedChecks = checks.sort((a, b) => b.job.localeCompare(a.job));
    this.setState(
      {
        checks: sortedChecks,
      },
      this.filterChecks
    );
  };

  onGoBack = (refresh: boolean) => {
    this.setState({
      addNew: false,
    });
    if (refresh) {
      this.onRefresh();
    }
    getLocationSrv().update({
      partial: true,
      query: {
        id: '',
      },
    });
  };

  render() {
    const { instance } = this.props;
    const { check, addNew, loading } = this.state;
    if (loading) {
      return <div>Loading...</div>;
    }
    if (check) {
      return <CheckEditor check={check} instance={instance.api} onReturn={this.onGoBack} />;
    }
    if (addNew) {
      const template = {
        job: '',
        target: '',
        queryParams: [],
        frequency: 60000,
        timeout: 2500,
        enabled: true,
        labels: [],
        probes: [],
        settings: {
          ping: {
            ipVersion: IpVersion.V4,
            dontFragment: false,
          },
        },
      } as Check;
      return <CheckEditor check={template} instance={instance.api} onReturn={this.onGoBack} />;
    }
    return <div>{this.renderCheckList()}</div>;
  }
}
