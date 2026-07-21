import { AnnotationEvent, AnnotationQuery } from '@grafana/data';

import { dedupAnnotationEvents, postProcessAnnotationEvents } from './annotationQueryUtils';

jest.mock('@grafana/runtime', () => ({
  config: {
    theme2: {
      visualization: {
        getColorByName: (name: string) => name,
      },
    },
  },
}));

describe('annotationQueryUtils', () => {
  const annotation: AnnotationQuery = {
    name: 'Show alerts firing',
    iconColor: 'red',
    enable: true,
    hide: false,
    datasource: { type: 'prometheus', uid: 'prom' },
  };

  it('marks alert ranges and applies pending color', () => {
    const events: AnnotationEvent[] = [
      { time: 1, timeEnd: 2, newState: 'pending' },
      { time: 3, timeEnd: 3, newState: 'alerting' },
    ];

    const processed = postProcessAnnotationEvents(annotation, events);

    expect(processed[0]?.isRegion).toBe(true);
    expect(processed[0]?.color).toBe('yellow');
    expect(processed[1]?.color).toBe('red');
  });

  it('deduplicates events with the same id', () => {
    const events: Array<AnnotationEvent & { eventType?: string }> = [
      { id: '1', time: 1, eventType: 'panel-alert' },
      { id: '1', time: 2, eventType: 'alert' },
    ];

    expect(dedupAnnotationEvents(events)).toHaveLength(1);
    expect((dedupAnnotationEvents(events)[0] as { eventType?: string }).eventType).toBe('alert');
  });
});
