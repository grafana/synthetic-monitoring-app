import { DataFrame } from '@grafana/data';
import { CustomTransformOperator } from '@grafana/scenes';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Scenes data is very opaque and hard to debug.
// Insert this function in the transformation pipeline at any / multiple points
// in the transformation chain to view what is happening to the data.

export const debugTransform: CustomTransformOperator = () => (source: Observable<DataFrame[]>) => {
  return source.pipe(
    map((data: DataFrame[]) => {
      // eslint-disable-next-line no-console
      console.log(data);
      return data;
    })
  );
};
