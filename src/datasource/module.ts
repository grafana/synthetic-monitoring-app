import { DataSourcePlugin } from '@grafana/data';
import { SMDataSource } from './DataSource';
import { ConfigEditor } from './ConfigEditor';
import { QueryEditor } from './QueryEditor';
import { SMQuery, SMOptions } from './types';

export const plugin = new DataSourcePlugin<SMDataSource, SMQuery, SMOptions>(SMDataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
