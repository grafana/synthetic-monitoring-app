import { AppEvents, PanelModel } from '@grafana/data';
import { sceneGraph, VizPanel, VizPanelMenu, VizPanelState } from '@grafana/scenes';
import { DataQuery } from '@grafana/schema';
import appEvents from 'grafana/app/core/app_events';

interface DataQueryExtended extends DataQuery {
  expr: string;
}

interface ServiceOverviewPanelState extends VizPanelState {
  trackingAction: string;
}

export class ExplorablePanel extends VizPanel {
  constructor(state: Partial<ServiceOverviewPanelState>) {
    super({
      ...state,
    });

    this.initMenu();
  }

  private getBasicJsonDefinition(): Partial<PanelModel> {
    return {
      fieldConfig: this.state.fieldConfig,
      description: this.state.description,
      options: this.state.options,
      type: this.state.pluginId,
    };
  }

  private initMenu() {
    this.addActivationHandler(() => {
      const data = sceneGraph.getData(this);

      const unsubscribable = data.subscribeToState((newDataState) => {
        let queries = (newDataState.data?.request?.targets ?? []) as DataQueryExtended[];
        queries = queries.map((q) => ({
          ...q,
          expr: sceneGraph.interpolate(this, q.expr),
        }));

        const datasource = queries.find((query) => !!query.datasource?.uid)?.datasource?.uid;

        if (datasource) {
          const { from, to } = sceneGraph.getTimeRange(this).state;

          const left = encodeURIComponent(
            JSON.stringify({
              datasource,
              queries,
              range: {
                from,
                to,
              },
            })
          );

          const panelJson = this.getBasicJsonDefinition();
          panelJson.datasource = { uid: datasource };
          panelJson.targets = queries;
          this.setState({
            menu: new VizPanelMenu({
              items: [
                {
                  type: 'submenu',
                  iconClassName: 'compass',
                  text: 'Explore',
                  href: `/explore?left=${left}`,
                },
                {
                  type: 'submenu',
                  iconClassName: 'copy',
                  text: 'Copy JSON',
                  onClick: () => {
                    try {
                      navigator.clipboard.writeText(JSON.stringify(panelJson));
                      appEvents.emit(AppEvents.alertSuccess, ['Panel JSON copied to clipboard']);
                    } catch (e: any) {
                      reportError(e);
                      appEvents.emit(AppEvents.alertError, ['Failed to copy JSON: ' + e?.message]);
                    }
                  },
                },
              ],
            }),
          });
        }
      });

      return () => unsubscribable.unsubscribe?.();
    });
  }
}
