import { DataSourcePlugin } from '@grafana/data';
import { WorldPingDataSource } from './DataSource';
import { ConfigEditor } from './ConfigEditor';
import { QueryEditor } from './QueryEditor';
import { WorldpingQuery, WorldpingOptions } from './types';

export const plugin = new DataSourcePlugin<WorldPingDataSource, WorldpingQuery, WorldpingOptions>(WorldPingDataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
