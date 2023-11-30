import { CheckType } from 'types';
import { getEmptyScene } from 'scenes/Common/emptyScene';

export function getScriptedScene() {
  return getEmptyScene(CheckType.K6);
}
