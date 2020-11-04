import { PluginMeta } from '@grafana/data';
import { getLocationSrv } from '@grafana/runtime';

export class ExampleConfigCtrl {
  static templateUrl = 'legacy/config.html';

  appEditCtrl: any;
  appModel?: PluginMeta;
  $q: any;

  /** @ngInject */
  constructor($scope: any, $injector: any, $q: any) {
    this.appEditCtrl.setPostUpdateHook(this.postUpdate.bind(this));
    this.$q = $q;
  }

  postUpdate() {
    getLocationSrv().update({
      path: 'a/grafana-synthetic-monitoring-app',
      query: {
        page: 'config',
      },
      partial: true,
    });
    return this.$q.resolve();
  }
}
