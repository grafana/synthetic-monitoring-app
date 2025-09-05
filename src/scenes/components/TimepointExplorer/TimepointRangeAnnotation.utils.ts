import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { AnnotationWithIndices } from 'scenes/components/TimepointExplorer/TimepointExplorerAnnotations.utils';

export function getOffsetAndDirection(
  renderingStrategy: 'start' | 'end',
  displayWidth: number,
  timepointsInRange: StatelessTimepoint[],
  annotation: AnnotationWithIndices
) {
  if (renderingStrategy === 'start') {
    return {
      direction: 'left',
      offset: displayWidth * annotation.visibleStartIndex,
    };
  }

  const displayIndex = timepointsInRange.length - annotation.visibleEndIndex - 1;

  return {
    direction: 'right',
    offset: displayWidth * displayIndex,
  };
}
