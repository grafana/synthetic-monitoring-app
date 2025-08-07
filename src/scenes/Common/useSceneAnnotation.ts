import { useEffect, useState } from 'react';
import { SceneDataLayerSet } from '@grafana/scenes';
import { useSceneContext } from '@grafana/scenes-react';

// Chris - PS. I hate this. It is so needlessly complicated.
export const useSceneAnnotation = (name: string) => {
  const scene = useSceneContext();
  const [events, setEvents] = useState<number[][]>([]);

  useEffect(() => {
    scene.subscribeToState((sceneState) => {
      // @ts-expect-error -- not typed...
      const layers = sceneState.$data?.state.layers as SceneDataLayerSet[];
      const layer = layers.find((layer) => layer.state.name === name);

      if (layer) {
        const events = findAnnotationLayer(layers, name);
        // set state with initial events
        setEvents(events);

        // subscribe to layer state changes
        layer.subscribeToState((layerState) => {
          const annotationEvents = findAnnotationLayer(layers, name);
          setEvents(annotationEvents);
        });
      }
    });
  }, [scene, name]);

  return events;
};

function findAnnotationLayer(layers: SceneDataLayerSet[], name: string): number[][] {
  if (!layers) {
    return [];
  }

  const layer = layers.find((layer) => layer.state.name === name);

  if (!layer?.state?.data) {
    return [];
  }

  const series = layer.state.data.series;
  const timeStarts = series[0]?.fields?.find((field) => field.name === 'time')?.values || [];
  const timeEnds = series[0]?.fields?.find((field) => field.name === 'timeEnd')?.values || [];

  const events = timeStarts.map((timeStart, index) => [timeStart, timeEnds[index]]);

  return events;
}
