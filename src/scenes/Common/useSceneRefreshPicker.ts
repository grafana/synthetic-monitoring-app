import { useEffect } from 'react';
import { durationToMilliseconds, parseDuration } from '@grafana/data';
import { sceneGraph, SceneRefreshPicker, SceneRefreshPickerState } from '@grafana/scenes';
import { useSceneContext } from '@grafana/scenes-react';

export function useSceneRefreshPicker(onRefresh?: () => void) {
  const sceneContext = useSceneContext();
  const refreshPicker = sceneGraph.findObject(sceneContext, (obj) => obj instanceof SceneRefreshPicker);
  const state = refreshPicker?.state as SceneRefreshPickerState;

  // backdoor... 🤮
  const el = document.querySelector(`[data-testid="data-testid RefreshPicker run button"]`);

  useEffect(() => {
    const listener = () => {
      onRefresh?.();
    };

    el?.addEventListener('click', listener);

    return () => {
      el?.removeEventListener('click', listener);
    };
  }, [el, onRefresh]);

  if (refreshPicker?.state) {
    return {
      ...state,
      refreshInMs: durationToMilliseconds(parseDuration(state.refresh)),
    };
  }

  return null;
}
