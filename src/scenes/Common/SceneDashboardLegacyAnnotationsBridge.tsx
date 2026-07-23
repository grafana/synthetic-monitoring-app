import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { DataFrame, PanelData } from '@grafana/data';
import { useSceneContext } from '@grafana/scenes-react';
import {
  annotationFramesToEvents,
  annotationFramesToNamedAlertEpisodes,
} from 'dashboards/annotations/annotationEvents';
import { DashboardAnnotationsStaticProvider } from 'dashboards/annotations/DashboardAnnotationsProvider';
import { useDashboardContainerAnnotations } from 'dashboards/annotations/useDashboardContainerAnnotations';

import { Check } from 'types';

type AnnotationLayerLike = {
  state: {
    name?: string;
    isEnabled?: boolean;
    data?: PanelData;
  };
  subscribeToState: (cb: () => void) => { unsubscribe: () => void };
};

function getAnnotationLayers(scene: { state: { $data?: unknown } }): AnnotationLayerLike[] {
   
  return (((scene.state.$data as any)?.state?.layers as AnnotationLayerLike[] | undefined) ?? []);
}

export function SceneDashboardLegacyAnnotationsBridge({
  check,
  children,
}: PropsWithChildren<{ check: Check }>) {
  const scene = useSceneContext();
  const definitions = useDashboardContainerAnnotations(check);
  const [enabledByName, setEnabledByName] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(definitions.map((definition) => [definition.name!, definition.enable !== false]))
  );
  const [framesByName, setFramesByName] = useState<Record<string, DataFrame[]>>({});

  useEffect(() => {
    const layerUnsubscribers = new Map<AnnotationLayerLike, () => void>();

    const readFrames = () => {
      const layers = getAnnotationLayers(scene);
      const nextFrames = Object.fromEntries(
        layers.map((layer) => [layer.state.name ?? '', layer.state.isEnabled ? layer.state.data?.series ?? [] : []])
      );

      setFramesByName(nextFrames);
      setEnabledByName((current) => {
        const next = { ...current };

        for (const layer of layers) {
          if (layer.state.name) {
            next[layer.state.name] = layer.state.isEnabled !== false;
          }
        }

        return next;
      });
    };

    const syncLayerSubscriptions = () => {
      const layers = getAnnotationLayers(scene);
      const active = new Set(layers);

      for (const [layer, unsubscribe] of layerUnsubscribers) {
        if (!active.has(layer)) {
          unsubscribe();
          layerUnsubscribers.delete(layer);
        }
      }

      for (const layer of layers) {
        if (!layerUnsubscribers.has(layer)) {
          const subscription = layer.subscribeToState(() => readFrames());
          layerUnsubscribers.set(layer, () => subscription.unsubscribe());
        }
      }

      readFrames();
    };

    syncLayerSubscriptions();
    const sceneSubscription = scene.subscribeToState(() => syncLayerSubscriptions());

    return () => {
      sceneSubscription.unsubscribe();

      for (const unsubscribe of layerUnsubscribers.values()) {
        unsubscribe();
      }

      layerUnsubscribers.clear();
    };
  }, [scene]);

  const value = useMemo(
    () => ({
      definitions,
      enabledByName,
      framesByName,
      frames: Object.entries(framesByName)
        .filter(([name]) => enabledByName[name] !== false)
        .flatMap(([, frames]) => frames),
      eventsByName: Object.fromEntries(
        Object.entries(framesByName).map(([name, frames]) => [name, annotationFramesToEvents(frames)])
      ),
      alertEpisodesByName: Object.fromEntries(
        Object.entries(framesByName).map(([name, frames]) => [
          name,
          annotationFramesToNamedAlertEpisodes(frames),
        ])
      ),
      setEnabled: (name: string, enabled: boolean) => {
        setEnabledByName((current) => ({ ...current, [name]: enabled }));
      },
    }),
    [definitions, enabledByName, framesByName]
  );

  return <DashboardAnnotationsStaticProvider value={value}>{children}</DashboardAnnotationsStaticProvider>;
}
