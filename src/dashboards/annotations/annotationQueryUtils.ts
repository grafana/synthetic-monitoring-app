import { AnnotationEvent, AnnotationQuery } from '@grafana/data';
import { config } from '@grafana/runtime';

export function postProcessAnnotationEvents(
  annotation: AnnotationQuery,
  results: AnnotationEvent[]
): AnnotationEvent[] {
  const processedAnnotation = annotation.snapshotData
    ? (() => {
        const copy = { ...annotation };
        delete copy.snapshotData;
        return copy;
      })()
    : annotation;

  return results.map((item) => {
    const processedItem: AnnotationEvent = {
      ...item,
      source: processedAnnotation,
      color: config.theme2.visualization.getColorByName(annotation.iconColor ?? 'red'),
      type: annotation.name,
      isRegion: Boolean(item.timeEnd && item.time !== item.timeEnd),
    };

    switch (processedItem.newState?.toLowerCase()) {
      case 'pending':
        processedItem.color = 'yellow';
        break;
      case 'alerting':
        processedItem.color = 'red';
        break;
      case 'ok':
      case 'normal':
        processedItem.color = 'green';
        break;
      case 'no_data':
      case 'nodata':
        processedItem.color = 'gray';
        break;
    }

    return processedItem;
  });
}

function isPanelAlert(event: AnnotationEvent): boolean {
  return (event as AnnotationEvent & { eventType?: string }).eventType === 'panel-alert';
}

export function dedupAnnotationEvents(annotations: AnnotationEvent[]): AnnotationEvent[] {
  const withId: AnnotationEvent[] = [];
  const withoutId: AnnotationEvent[] = [];

  for (const event of annotations) {
    if (event.id) {
      withId.push(event);
    } else {
      withoutId.push(event);
    }
  }

  const eventsById = new Map<string, AnnotationEvent[]>();

  for (const event of withId) {
    const id = event.id!;
    const group = eventsById.get(id) ?? [];
    group.push(event);
    eventsById.set(id, group);
  }

  const deduped = [...withoutId];

  for (const eventGroup of eventsById.values()) {
    if (eventGroup.length > 1 && !eventGroup.every(isPanelAlert)) {
      const preferred = eventGroup.find(
        (event) => (event as AnnotationEvent & { eventType?: string }).eventType !== 'panel-alert'
      );
      if (preferred) {
        deduped.push(preferred);
      }
    } else {
      deduped.push(eventGroup[0]!);
    }
  }

  return deduped;
}
