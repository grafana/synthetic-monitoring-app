import { DataFrame, DataTransformContext, transformDataFrame } from '@grafana/data';
import { Observable, of, Subscription } from 'rxjs';

import { cloneFrame } from './frameUtils';

export type DashboardTransformDefinition = {
  id: string;
  options?: Record<string, unknown>;
};

export function applyTransforms(
  frames: DataFrame[],
  transforms: DashboardTransformDefinition[],
  context: DataTransformContext
): Observable<DataFrame[]> {
  if (transforms.length === 0) {
    return of(cloneFrames(frames));
  }

  return transformDataFrame(
    transforms.map((transform) => ({
      id: transform.id,
      options: transform.options ?? {},
    })),
    cloneFrames(frames),
    context
  );
}

export function subscribeTransforms(
  frames: DataFrame[],
  transforms: DashboardTransformDefinition[],
  context: DataTransformContext,
  onNext: (frames: DataFrame[]) => void
): Subscription {
  return applyTransforms(frames, transforms, context).subscribe(onNext);
}

function cloneFrames(frames: DataFrame[]): DataFrame[] {
  return frames.map(cloneFrame);
}
