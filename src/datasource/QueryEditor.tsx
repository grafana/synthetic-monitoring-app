import React, { PureComponent } from 'react';
import { defaults } from 'lodash';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { SMDataSource } from './DataSource';
import { SMQuery, SMOptions, QueryType, defaultQuery } from './types';
import { Select } from '@grafana/ui';

type Props = QueryEditorProps<SMDataSource, SMQuery, SMOptions>;

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
