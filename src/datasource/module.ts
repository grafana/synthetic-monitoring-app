import { DataSourcePlugin } from '@grafana/data';

import { SMOptions,SMQuery } from './types';

import { ConfigEditor } from './ConfigEditor';
import { SMDataSource } from './DataSource';
import { QueryEditor } from './QueryEditor';

export const plugin = new DataSourcePlugin<SMDataSource, SMQuery, SMOptions>(SMDataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
