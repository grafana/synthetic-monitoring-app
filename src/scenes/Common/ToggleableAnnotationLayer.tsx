import React, { PropsWithChildren, useEffect, useState } from 'react';
import { AnnotationQuery } from '@grafana/data';
import { dataLayers, SceneDataLayerProvider, SceneDataLayerSet } from '@grafana/scenes';
import { SceneContextObject, useSceneContext } from '@grafana/scenes-react';

interface ToggleableAnnotationLayerProps extends PropsWithChildren {
  name: string;
  query: AnnotationQuery;
}

// Same behavior as the AnnotationLayer from @grafana/scenes-react, except the
// initial toggle state honors `query.enable` — the library version always
// constructs the layer enabled and only syncs `enable` after user toggles.
export const ToggleableAnnotationLayer = ({ name, query, children }: ToggleableAnnotationLayerProps) => {
  const scene = useSceneContext();
  const [annotationAdded, setAnnotationAdded] = useState(false);

  let annotation = findAnnotationLayer(scene, name);

  if (!annotation) {
    annotation = new dataLayers.AnnotationsDataLayer({ name, query, isEnabled: query.enable !== false });
  }

  useEffect(() => {
    const removeFn = addAnnotationLayer(scene, annotation!);
    setAnnotationAdded(true);

    return removeFn;
  }, [scene, name, annotation]);

  if (!annotationAdded) {
    return null;
  }

  return <>{children}</>;
};

function findAnnotationLayer(scene: SceneContextObject, name: string) {
  const set = scene.state.$data as SceneDataLayerSet | undefined;

  return set?.state.layers.find((layer) => layer.state.name === name);
}

function addAnnotationLayer(scene: SceneContextObject, layer: SceneDataLayerProvider) {
  let set = scene.state.$data as SceneDataLayerSet | undefined;

  if (set) {
    set.setState({ layers: [...set.state.layers, layer] });
  } else {
    set = new SceneDataLayerSet({ layers: [layer] });
    scene.setState({ $data: set });
  }

  const layerSet = set;

  return () => {
    layerSet.setState({ layers: layerSet.state.layers.filter((x) => x !== layer) });
  };
}
