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
import CheckEditor from 'components/CheckEditor';
import { CheckHealth } from 'components/CheckHealth';
import { UptimeGauge } from 'components/UptimeGauge';
import { CheckList } from 'components/CheckList';
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
    try {
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
    } catch (e) {
      console.log('in herrrre', e);
    }
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

  onFilterByLabel = (labelName: string, labelValue: string) => (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.stopPropagation();
    this.setState({ searchFilter: `${labelName}=${labelValue}`, currentPage: 1 }, this.filterChecks);
  };

  changePage = (toPage: number) => {
    this.setState({ currentPage: toPage }, this.filterChecks);
  };

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
    const { check, addNew, loading, checks } = this.state;
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
    return <CheckList instance={instance} onAddNewClick={this.onAddNew} checks={checks} />;
  }
}
