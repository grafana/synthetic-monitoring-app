import { DataFrame, Field, FieldType } from '@grafana/data';

export interface LokiSeries<T, R> extends DataFrame {
  fields: Array<Labels<T> | Time | Line | TsNs | LabelTypes<R> | ID>;
}

export type Labels<T> = Field<T> & {
  name: `labels`;
  type: FieldType.other;
  typeInfo: {
    frame: `json.RawMessage`;
  };
};

export type Time = Field<number> & {
  name: `Time`;
  type: FieldType.time;
  typeInfo: {
    frame: `time.Time`;
  };
  nanos: number[];
};

export type Line = Field<string> & {
  name: `Line`;
  type: FieldType.string;
  typeInfo: {
    frame: `string`;
  };
};

export type TsNs = Field<string> & {
  name: `tsNs`;
  type: FieldType.string;
  typeInfo: {
    frame: `string`;
  };
};

export type LabelType<R> = Record<string, string> & R;

export type LabelTypes<R> = Field<LabelType<R>> & {
  config: {
    custom: {
      hidden: true;
    };
  };
  name: `labelTypes`;
  type: FieldType.other;
  typeInfo: {
    frame: `json.RawMessage`;
  };
};

export type ID = Field<string> & {
  name: `id`;
  type: FieldType.string;
  typeInfo: {
    frame: `string`;
  };
};
