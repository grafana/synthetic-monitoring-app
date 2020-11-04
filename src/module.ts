// Angular pages
import { ExampleConfigCtrl } from './legacy/config';
import { AppPlugin } from '@grafana/data';
import { GlobalSettings } from './types';
import { App } from 'components/App';

// Legacy exports just for testing
export { ExampleConfigCtrl as ConfigCtrl };

export const plugin = new AppPlugin<GlobalSettings>().setRootPage(App);
