import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './DataSource';
import { ConfigEditor } from './ConfigEditor';
import { QueryEditor } from './QueryEditor';
import { WorldpingQuery, WorldpingOptions } from './types';

export const plugin = new DataSourcePlugin<DataSource, WorldpingQuery, WorldpingOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
