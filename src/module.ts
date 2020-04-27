// Angular pages
import { ExampleConfigCtrl } from './legacy/config';
import { AppPlugin } from '@grafana/data';
import { SetupPage } from './config/SetupPage';
import { GlobalSettings } from './types';
import { ChecksPage } from 'config/ChecksPage';

// Legacy exports just for testing
export { ExampleConfigCtrl as ConfigCtrl };

export const plugin = new AppPlugin<GlobalSettings>()
  .addConfigPage({
    title: 'Setup',
    icon: 'fa fa-star',
    body: SetupPage,
    id: 'setup',
  })
  .addConfigPage({
    title: 'Checks',
    icon: 'fa check-square-o',
    body: ChecksPage,
    id: 'checks',
  });
