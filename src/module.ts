// Angular pages
import { AppPlugin } from '@grafana/data';
import { GlobalSettings } from './types';
import { App } from 'components/App';
import { ConfigPage } from 'page/ConfigPage';

// Legacy exports just for testing
// export { ExampleConfigCtrl as ConfigCtrl };

export const plugin = new AppPlugin<GlobalSettings>().setRootPage(App).addConfigPage({
  title: 'Config',
  icon: 'info-circle',
  body: ConfigPage,
  id: 'config2',
});
