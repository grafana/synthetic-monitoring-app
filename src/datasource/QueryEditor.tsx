import React, { PureComponent } from 'react';
import { defaults } from 'lodash';
import { GrafanaTheme, QueryEditorProps, SelectableValue } from '@grafana/data';
import { SMDataSource } from './DataSource';
import { SMQuery, SMOptions, QueryType, defaultQuery, DashboardVariable } from './types';
import { getTheme, Select, Spinner } from '@grafana/ui';
import { css } from 'emotion';
import { checkType } from 'utils';
import { CheckType, FeatureName } from 'types';
import { getTemplateSrv } from '@grafana/runtime';
import { FeatureFlag } from 'components/FeatureFlag';

type Props = QueryEditorProps<SMDataSource, SMQuery, SMOptions>;

interface TracerouteCheckOptionValue {
  job: string;
  instance: string;
}

interface State {
  tracerouteCheckOptions: Array<SelectableValue<TracerouteCheckOptionValue>>;
  tracerouteCheckOptionsLoading: boolean;
  selectedTracerouteCheckOption?: TracerouteCheckOptionValue;
}

const types = [
  { label: 'Probes', value: QueryType.Probes },
  { label: 'Checks', value: QueryType.Checks },
  { label: 'Traceroute', value: QueryType.Traceroute },
];

const getStyles = (theme: GrafanaTheme) => ({
  tracerouteFieldWrapper: css`
    display: flex;
    flex-direction: row;
  `,
  marginRight: css`
    margin-right: ${theme.spacing.sm};
  `,
});

export class QueryEditor extends PureComponent<Props, State> {
  state: State = {
    tracerouteCheckOptions: [],
    tracerouteCheckOptionsLoading: true,
  };

  componentDidMount() {
    this.getTracerouteCheckOptions();
  }

  // onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   const { onChange, query } = this.props;
  //   onChange({ ...query, queryText: event.target.value });
  // };

  // onConstantChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   const { onChange, query, onRunQuery } = this.props;
  //   onChange({ ...query, constant: parseFloat(event.target.value) });
  //   onRunQuery(); // executes the query
  // };

  getTracerouteCheckOptions = async () => {
    const { datasource } = this.props;
    // await query.datasource.
    const checks = await datasource.listChecks();
    const tracerouteCheckOptions = checks
      .filter((check) => checkType(check.settings) === CheckType.Traceroute)
      .map<SelectableValue<TracerouteCheckOptionValue>>((check) => {
        return {
          value: {
            instance: check.target,
            job: check.job,
          },
          label: check.job,
          description: check.target,
        };
      });

    this.setState({
      tracerouteCheckOptions,
      tracerouteCheckOptionsLoading: false,
      selectedTracerouteCheckOption: tracerouteCheckOptions[0]?.value,
    });
  };

  onQueryTypeChanged = (item: SelectableValue<QueryType>) => {
    const { onChange, onRunQuery, query } = this.props;
    const { selectedTracerouteCheckOption } = this.state;

    if (!item.value) {
      return;
    }
    onChange({
      ...query,
      queryType: item.value!,
      instance: selectedTracerouteCheckOption?.instance,
      job: selectedTracerouteCheckOption?.job,
    });
    onRunQuery();
  };

  onTracerouteCheckChange = async (check: SelectableValue<TracerouteCheckOptionValue>) => {
    const { onChange, onRunQuery, query } = this.props;
    onChange({
      ...query,
      queryType: QueryType.Traceroute,
      instance: check.value?.instance,
      job: check.value?.job,
    });
    this.setState({ selectedTracerouteCheckOption: check.value });
    onRunQuery();
  };

  getSelectedDashboardTracerouteOption(): TracerouteCheckOptionValue | undefined {
    const { tracerouteCheckOptions } = this.state;
    const dashboardVars = getTemplateSrv().getVariables() ?? [];
    const instance = dashboardVars.find((variable) => variable.name === 'instance') as DashboardVariable | undefined;
    const job = dashboardVars.find((variable) => variable.name === 'job') as DashboardVariable | undefined;
    const dashboardInstance = instance?.current?.value;
    const dashboardJob = job?.current?.value;

    const selected = tracerouteCheckOptions.find(
      (option) => option.value?.job === dashboardJob && option.value?.instance === dashboardInstance
    );

    if (dashboardInstance && dashboardJob && selected) {
      return selected?.value;
    }
    return undefined;
  }

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { tracerouteCheckOptions, tracerouteCheckOptionsLoading, selectedTracerouteCheckOption } = this.state;
    const styles = getStyles(getTheme());

    if (tracerouteCheckOptionsLoading) {
      return <Spinner />;
    }
    const selectedDashboardOption = this.getSelectedDashboardTracerouteOption();
    const selected = selectedDashboardOption ?? selectedTracerouteCheckOption;

    return (
      <FeatureFlag name={FeatureName.Traceroute}>
        {({ isEnabled }) => {
          const queryTypes = isEnabled ? types : types.filter(({ value }) => value !== QueryType.Traceroute);
          return (
            <div>
              <div className="gf-form">
                <Select
                  options={queryTypes}
                  value={queryTypes.find((t) => t.value === query.queryType)}
                  onChange={this.onQueryTypeChanged}
                />
              </div>
              {isEnabled && query.queryType === QueryType.Traceroute && (
                <div className={styles.tracerouteFieldWrapper}>
                  <Select
                    options={tracerouteCheckOptions}
                    prefix="Check"
                    value={tracerouteCheckOptions.find((option) => option.value === selected)}
                    onChange={this.onTracerouteCheckChange}
                    disabled={Boolean(selectedDashboardOption)}
                  />
                </div>
              )}
            </div>
          );
        }}
      </FeatureFlag>
    );
  }
}
