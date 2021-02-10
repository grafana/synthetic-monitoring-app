import { AppPlugin } from '@grafana/data';
import { GlobalSettings } from './types';
import { App } from 'components/App';
import { ConfigPage } from 'page/ConfigPage';

export const plugin = new AppPlugin<GlobalSettings>().setRootPage(App).addConfigPage({
  title: 'Config',
  icon: 'cog',
  body: ConfigPage,
  id: 'config',
});
