import { PluginMeta } from '@grafana/data';
import { getLocationSrv, config } from '@grafana/runtime';

export class ExampleConfigCtrl {
  static templateUrl = 'legacy/config.html';

  appEditCtrl: any;
  appModel?: PluginMeta;
  $q: any;
  configured: boolean;

  /** @ngInject */
  constructor($scope: any, $injector: any, $q: any) {
    this.appEditCtrl.setPostUpdateHook(this.postUpdate.bind(this));
    this.$q = $q;
    // Make sure it has a JSON Data spot
    if (!this.appModel) {
      this.appModel = {} as PluginMeta;
    }

    // Required until we get the types sorted on appModel :(
    const appModel = this.appModel as any;
    if (!appModel.jsonData) {
      appModel.jsonData = {};
    }
    this.configured = false;
    if (this.appModel?.enabled) {
      const datasources = Object.values(config.datasources).filter(ds => {
        return ds.type === 'synthetic-monitoring-datasource';
      });
      if (datasources.length > 0) {
        this.configured = true;
      }
    }
  }

  postUpdate() {
    if (!this.appModel?.enabled) {
      return;
    }
    getLocationSrv().update({
      path: 'a/grafana-synthetic-monitoring-app/?page=config',
      partial: false,
    });
    return this.$q.resolve(true);
  }
}
