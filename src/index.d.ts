declare module 'react-leaflet';
declare module 'body-parser';

// We need this import because of https://github.com/grafana/grafana/issues/26512
import { FieldErrors } from 'react-hook-form';
import {} from '@emotion/core';

import { CheckFormValues } from 'types';
import { CHECK_FORM_ERROR_EVENT } from 'components/constants';

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

interface CustomEventMap {
  [CHECK_FORM_ERROR_EVENT]: CustomEvent<FieldErrors<CheckFormValues>>;
}

declare global {
  interface Document {
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Document, ev: CustomEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Document, ev: CustomEventMap[K]) => any,
      options?: boolean | EventListenerOptions
    ): void;
  }
}
