import React, { PureComponent } from 'react';
import { defaults } from 'lodash';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { WorldPingDataSource } from './DataSource';
import { WorldpingQuery, WorldpingOptions, QueryType, defaultQuery } from './types';
import { Select } from '@grafana/ui';

type Props = QueryEditorProps<WorldPingDataSource, WorldpingQuery, WorldpingOptions>;

interface State {}

const types = [
  { label: 'Probes', value: QueryType.Probes },
  { label: 'Checks', value: QueryType.Checks },
];

export class QueryEditor extends PureComponent<Props, State> {
  onComponentDidMount() {}

  // onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   const { onChange, query } = this.props;
  //   onChange({ ...query, queryText: event.target.value });
  // };

  // onConstantChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   const { onChange, query, onRunQuery } = this.props;
  //   onChange({ ...query, constant: parseFloat(event.target.value) });
  //   onRunQuery(); // executes the query
  // };

  onQueryTypeChanged = (item: SelectableValue<QueryType>) => {
    const { onChange, onRunQuery, query } = this.props;
    onChange({
      ...query,
      queryType: item.value!,
    });
    onRunQuery();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);

    return (
      <div className="gf-form">
        <Select
          options={types}
          value={types.find(t => t.value === query.queryType)}
          onChange={this.onQueryTypeChanged}
        />
      </div>
    );
  }
}
