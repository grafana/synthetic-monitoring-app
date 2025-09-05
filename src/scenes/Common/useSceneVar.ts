import { useVariables } from '@grafana/scenes-react';

export function useSceneVar(name: string) {
  const vars = useVariables();
  const variable = vars.find((v) => v.state.name === name);

  // @ts-expect-error - value is not typed
  const value: string[] = variable?.state.value;

  if (value.includes(`$__all`)) {
    return ['.*'];
  }

  return value;
}
