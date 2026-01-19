import { DataFrame, Field, FieldType } from '@grafana/data';

export enum LokiFieldNames {
  Labels = 'labels',
  TimeStamp = 'timestamp',
  Body = 'body',
  LabelTypes = 'labelTypes',
  ID = 'id',
  Nanos = 'nanos',
}

export enum LokiFieldNamesOld {
  Labels = LokiFieldNames.Labels,
  Time = 'Time',
  Line = 'Line',
  TsNs = 'tsNs',
  LabelTypes = LokiFieldNames.LabelTypes,
  ID = LokiFieldNames.ID,
}

export type LokiFieldsOld<T, R> = [Labels<T>, TimeOld, LineOld, TsNsOld, LabelTypes<R>, ID];

export type LokiFields<T, R> = [Labels<T>, TimeStamp, Body, LabelTypes<R>, ID];

export interface LokiDataFrame<T, R> extends DataFrame {
  fields: LokiFieldsOld<T, R> | LokiFields<T, R>;
}

export type Labels<T> = Field<T> & {
  name: LokiFieldNames.Labels;
  type: FieldType.other;
  typeInfo: {
    frame: `json.RawMessage`;
  };
};

export type TimeOld = Field<number> & {
  name: LokiFieldNamesOld.Time;
  type: FieldType.time;
  typeInfo: {
    frame: `time.Time`;
  };
  nanos: number[];
};

export type LineOld = Field<string> & {
  name: LokiFieldNamesOld.Line;
  type: FieldType.string;
  typeInfo: {
    frame: `string`;
  };
};

// timestamp in nanoseconds
export type TsNsOld = Field<string> & {
  name: LokiFieldNamesOld.TsNs;
  type: FieldType.string;
  typeInfo: {
    frame: `string`;
  };
};

// New schema field types (default)
export type TimeStamp = Field<number> & {
  name: LokiFieldNames.TimeStamp;
  type: FieldType.time;
  typeInfo: {
    frame: `time.Time`;
  };
  nanos: number[];
};

export type Body = Field<string> & {
  name: LokiFieldNames.Body;
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
  name: LokiFieldNames.LabelTypes;
  type: FieldType.other;
  typeInfo: {
    frame: `json.RawMessage`;
  };
};

export type ID = Field<string> & {
  name: LokiFieldNames.ID;
  type: FieldType.string;
  typeInfo: {
    frame: `string`;
  };
};

export type ParsedLokiRecord<L, LT> = {
  [LokiFieldNames.Labels]: L;
  [LokiFieldNames.TimeStamp]: number;
  [LokiFieldNames.Body]: string;
  [LokiFieldNames.Nanos]: number;
  [LokiFieldNames.LabelTypes]: LT;
  [LokiFieldNames.ID]: string;
};

export interface UnknownParsedLokiRecord extends ParsedLokiRecord<Record<string, string>, Record<string, string>> {}
