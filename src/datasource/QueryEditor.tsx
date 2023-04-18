import React, { PureComponent } from 'react';
import { defaults } from 'lodash';
import { GrafanaTheme, QueryEditorProps, SelectableValue } from '@grafana/data';
import { SMDataSource } from './DataSource';
import { SMQuery, SMOptions, QueryType, defaultQuery } from './types';
import { getTheme, MultiSelect, Select, Spinner } from '@grafana/ui';
import { css } from '@emotion/css';
import { checkType } from 'utils';
import { CheckType, FeatureName, Probe } from 'types';
import { getTemplateSrv } from '@grafana/runtime';
import { FeatureFlag } from 'components/FeatureFlag';

type Props = QueryEditorProps<SMDataSource, SMQuery, SMOptions>;

interface TracerouteCheckOptionValue {
  job: string;
  instance: string;
  probes: number[];
}

interface State {
  tracerouteCheckOptions: Array<SelectableValue<TracerouteCheckOptionValue>>;
  tracerouteCheckOptionsLoading: boolean;
  probes: Probe[];
  // tracerouteProbeOptions: Array<SelectableValue<string>>;
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

function getProbeOptionsForCheck(check: TracerouteCheckOptionValue | undefined, probes: Probe[]) {
  if (check === undefined) {
    return [];
  }
  const probeOptions = [] as Array<SelectableValue<string>>;
  check.probes.forEach((probeId: number) => {
    const probe = probes.find((probe) => probeId === probe.id);
    if (!probe) {
      return;
    }
    return probeOptions.push({
      value: probe.name,
      label: probe.name,
    });
  });
  return probeOptions;
}

export class QueryEditor extends PureComponent<Props, State> {
  constructor(props: Props, state: State) {
    super(props);
    this.state = {
      tracerouteCheckOptions: [],
      tracerouteCheckOptionsLoading: true,
      probes: [],
      // tracerouteProbeOptions: [],
    };
  }

  componentDidMount() {
    this.getTracerouteCheckOptions();
  }

  getTracerouteCheckOptions = async () => {
    const { datasource } = this.props;
    const checks = await datasource.listChecks();
    const probes = await datasource.listProbes();

    const tracerouteCheckOptions = checks
      .filter((check) => checkType(check.settings) === CheckType.Traceroute)
      .map<SelectableValue<TracerouteCheckOptionValue>>((check) => {
        return {
          value: {
            instance: check.target,
            job: check.job,
            probes: check.probes,
          },
          label: check.job,
          description: check.target,
        };
      });

    this.setState({
      tracerouteCheckOptions,
      probes,
      tracerouteCheckOptionsLoading: false,
    });
  };

  onQueryTypeChanged = (item: SelectableValue<QueryType>) => {
    const { onChange, onRunQuery, query } = this.props;

    if (!item.value) {
      return;
    }
    onChange({
      ...query,
      queryType: item.value!,
      instance: '',
      job: '',
      probe: '',
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
      probe: undefined,
    });
    onRunQuery();
  };

  onTracerouteProbeChange = async (probe: Array<SelectableValue<string>>) => {
    const { onChange, onRunQuery, query } = this.props;
    onChange({
      ...query,
      probe: probe
        .map(({ value }) => value ?? '')
        .filter((val) => Boolean(val))
        .join('|'),
    });
    onRunQuery();
  };

  getSelectedTracerouteOption(): TracerouteCheckOptionValue | undefined {
    const { query } = this.props;
    const { tracerouteCheckOptions } = this.state;
    const templateSrv = getTemplateSrv();
    let instance: string | undefined = templateSrv.replace('$instance');
    if (instance === '$instance') {
      instance = query.instance;
    }
    let job: string | undefined = templateSrv.replace('$job');
    if (job === '$job') {
      job = query.job;
    }

    const selected = tracerouteCheckOptions.find(
      (option) => option.value?.job === job && option.value?.instance === instance
    );

    if (instance && job && selected) {
      return selected?.value;
    }
    return undefined;
  }

  getSelectedTracerouteProbeOptions(): Array<SelectableValue<string>> {
    const { query } = this.props;
    const templateSrv = getTemplateSrv();
    let probe: string | undefined = templateSrv.replace('$probe');
    if (probe === '$probe') {
      probe = query.probe;
    }
    return (
      probe
        ?.replace('{', '')
        .replace('}', '')
        .split(/[\|\,]/)
        .map((probe) => ({ label: probe, value: probe })) ?? []
    );
  }

  isOverridenByDashboardVariable(): boolean {
    const templateSrv = getTemplateSrv();
    const instance = templateSrv.replace('$instance');
    const job = templateSrv.replace('$job');
    return instance !== '$instance' && job !== '$job';
  }

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { tracerouteCheckOptions, tracerouteCheckOptionsLoading, probes } = this.state;
    const styles = getStyles(getTheme());

    if (tracerouteCheckOptionsLoading) {
      return <Spinner />;
    }
    const selectedTracerouteOption = this.getSelectedTracerouteOption();
    const probeOptions = getProbeOptionsForCheck(selectedTracerouteOption, probes);
    const selectedProbeOptions = this.getSelectedTracerouteProbeOptions();
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
                <>
                  <div className={styles.tracerouteFieldWrapper}>
                    <Select
                      options={tracerouteCheckOptions}
                      prefix="Check"
                      value={tracerouteCheckOptions.find((option) => option.value === selectedTracerouteOption)}
                      onChange={this.onTracerouteCheckChange}
                      disabled={this.isOverridenByDashboardVariable()}
                    />
                  </div>
                  <div className={styles.tracerouteFieldWrapper}>
                    <MultiSelect
                      options={probeOptions}
                      prefix="Probe"
                      allowCustomValue
                      value={selectedProbeOptions}
                      onChange={this.onTracerouteProbeChange}
                      disabled={getTemplateSrv().replace('$probe') !== '$probe'}
                    />
                  </div>
                </>
              )}
            </div>
          );
        }}
      </FeatureFlag>
    );
  }
}
