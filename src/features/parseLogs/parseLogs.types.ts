import { DataFrame, Field, FieldType } from '@grafana/data';

export enum LokiFieldNames {
  Labels = 'labels',
  Time = 'Time',
  Line = 'Line',
  TsNs = 'tsNs',
  LabelTypes = 'labelTypes',
  ID = 'id',
}

export type LokiFields<T, R> = [Labels<T>, Time, Line, TsNs, LabelTypes<R>, ID];

export interface LokiSeries<T, R> extends DataFrame {
  fields: LokiFields<T, R>;
}

export type Labels<T> = Field<T> & {
  name: LokiFieldNames.Labels;
  type: FieldType.other;
  typeInfo: {
    frame: `json.RawMessage`;
  };
};

export type Time = Field<number> & {
  name: LokiFieldNames.Time;
  type: FieldType.time;
  typeInfo: {
    frame: `time.Time`;
  };
  nanos: number[];
};

export type Line = Field<string> & {
  name: LokiFieldNames.Line;
  type: FieldType.string;
  typeInfo: {
    frame: `string`;
  };
};

// timestamp in nanoseconds
export type TsNs = Field<string> & {
  name: LokiFieldNames.TsNs;
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
  [LokiFieldNames.Time]: number;
  [LokiFieldNames.Line]: string;
  [LokiFieldNames.TsNs]: number;
  [LokiFieldNames.LabelTypes]: LT;
  [LokiFieldNames.ID]: string;
};
