import { dataLayers, SceneDataLayers } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

export function getAlertAnnotations(metrics: DataSourceRef) {
  return new SceneDataLayers({
    layers: [
      new dataLayers.AnnotationsDataLayer({
        name: 'Alerts firing',
        isHidden: false,
        query: {
          datasource: metrics,
          expr: 'max(ALERTS{job="$job", instance="$instance", alertstate="firing"})',
          hide: false,
          legendFormat: 'alert firing',
          refId: 'alertsAnnotation',
          enable: true,
          iconColor: 'red',
          name: 'Alert firing',
          titleFormat: 'Alert firing',
        },
      }),
      new dataLayers.AnnotationsDataLayer({
        name: 'Alerts pending',
        isHidden: false,
        query: {
          datasource: metrics,
          expr: 'max(ALERTS{job="$job", instance="$instance", alertstate="pending"})',
          hide: false,
          legendFormat: 'alert firing',
          refId: 'alertsAnnotation',
          enable: true,
          iconColor: 'yellow',
          name: 'Alert pending',
          titleFormat: 'Alert pending',
        },
      }),
    ],
  });
}

export function getSummaryAlertAnnotations(metrics: DataSourceRef) {
  return new SceneDataLayers({
    layers: [
      new dataLayers.AnnotationsDataLayer({
        name: 'Alerts firing',
        isHidden: false,
        query: {
          datasource: metrics,
          expr: 'max(ALERTS{namespace="synthetic_monitoring", alertstate="firing"}) by (instance, job)',
          hide: false,
          legendFormat: '{{job}}/{{instance}}',
          refId: 'alertsAnnotation',
          enable: true,
          iconColor: 'red',
          name: 'Alert firing',
          titleFormat: 'Firing: {{job}}/{{instance}}',
        },
      }),
      new dataLayers.AnnotationsDataLayer({
        name: 'Alerts pending',
        isHidden: false,
        query: {
          datasource: metrics,
          expr: 'max(ALERTS{namespace="synthetic_monitoring", alertstate="pending"}) by (instance, job)',
          hide: false,
          legendFormat: '{{job}}/{{instance}}',
          refId: 'alertsAnnotation',
          enable: true,
          iconColor: 'yellow',
          name: 'Alert pending',
          titleFormat: 'Pending: {{job}}/{{instance}}',
        },
      }),
    ],
  });
}
