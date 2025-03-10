import { SceneTimeRange } from '@grafana/scenes';

export function getTimeRange() {
  return new SceneTimeRange({
    from: 'now-3h',
    to: 'now',
  });
}
