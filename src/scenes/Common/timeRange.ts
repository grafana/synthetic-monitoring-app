import { SceneTimeRange } from '@grafana/scenes';

import { DEFAULT_FROM_TIME } from 'components/constants';

export function getTimeRange() {
  return new SceneTimeRange({
    from: `now-${DEFAULT_FROM_TIME}`,
    to: 'now',
  });
}
