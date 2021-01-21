declare module 'react-leaflet';
// We need this import because of https://github.com/grafana/grafana/issues/26512
import {} from '@emotion/core';

declare module 'grafana/app/core/app_events';

// This is a monkey patch of the default Object.keys() typing that casts the return type to be a keyof the original object, instead of a string. https://fettblog.eu/typescript-better-object-keys/
type ObjectKeys<T> = T extends object
  ? Array<keyof T>
  : T extends number
  ? []
  : T extends any[] | string
  ? string[]
  : never;

interface ObjectConstructor {
  keys<T>(o: T): ObjectKeys<T>;
}
