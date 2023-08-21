import { sceneGraph, VizPanel, VizPanelMenu, VizPanelState } from '@grafana/scenes';
import { DataQuery } from '@grafana/schema';

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

    this.initHeaderActionsSync();
  }

  // // use upgraded encoding function that custom escapes "/"
  // interpolate: InterpolateFunction = (value, scopedVars, format) => {
  //   if (value.includes(':path')) {
  //     return sceneGraph.interpolate(
  //       this,
  //       value.replace(':path', ''),
  //       scopedVars,
  //       encodeParameter as VariableCustomFormatterFn
  //     );
  //   }

  //   return sceneGraph.interpolate(this, value, scopedVars, format as VariableCustomFormatterFn);
  // };

  private initHeaderActionsSync() {
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

          this.setState({
            menu: new VizPanelMenu({
              items: [
                {
                  type: 'submenu',
                  iconClassName: 'compass',
                  text: 'Explore',
                  href: `/explore?left=${left}`,
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
