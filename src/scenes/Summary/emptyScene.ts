import { EmbeddedScene, SceneReactObject } from '@grafana/scenes';
import { css } from '@emotion/css';

import { ChecksEmptyState } from 'components/ChecksEmptyState';

const wrapperStyles = css`
  width: 100%;
`;

export function getEmptyScene() {
  return new EmbeddedScene({
    body: new SceneReactObject({
      component: ChecksEmptyState,
      props: { className: wrapperStyles },
    }),
  });
}
