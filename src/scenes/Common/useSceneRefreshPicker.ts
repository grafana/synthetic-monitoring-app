import { useEffect } from 'react';
import { durationToMilliseconds, parseDuration } from '@grafana/data';
import { sceneGraph, SceneRefreshPicker, SceneRefreshPickerState } from '@grafana/scenes';
import { useSceneContext } from '@grafana/scenes-react';
import { DataTestIds } from 'test/dataTestIds';

export function useSceneRefreshPicker(onRefresh?: () => void) {
  const sceneContext = useSceneContext();
  const refreshPicker = sceneGraph.findObject(sceneContext, (obj) => obj instanceof SceneRefreshPicker);
  const state = refreshPicker?.state as SceneRefreshPickerState;

  // backdoor... 🤮
  const el = document.querySelector(`[data-testid=${DataTestIds.RefreshPickerRunButton}]`);

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
