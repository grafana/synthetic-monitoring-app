import { DataFrame, Field, FieldType } from '@grafana/data';

import { MSG_STRINGS_COMMON } from './logs.constants.msgs';

export type Label = Record<string, string> & {
  check_name: string; // this is really check type e.g. http
  detected_level: 'error' | 'info'; // might be more
  instance: string;
  job: string;
  probe: string;
  probe_success: '0' | '1';
  region: string; // might be undefined?
  service_name: string; // same as job
  source: 'synthetic-monitoring-agent'; // might be more?
};

export type Labels = Field<Label> & {
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

export type LabelType = Record<string, string> & {
  check_name: string; // I
  detected_level: string; // S
  instance: string; // I
  job: string; // I
};

export type LabelTypes = Field<LabelType> & {
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

export interface LokiSeries extends DataFrame {
  fields: Array<Labels | Time | Line | TsNs | LabelTypes | ID>;
}

export type LabelsWithTime = { time: number; nanotime: number; value: Label };

type StartingLog = LabelsWithTime & {
  value: Label & {
    msg: (typeof MSG_STRINGS_COMMON)['BeginningCheck'];
  };
};

type CheckFailedLog = LabelsWithTime & {
  value: Label & {
    msg: (typeof MSG_STRINGS_COMMON)['CheckFailed'];
  };
};

type CheckSucceededLog = LabelsWithTime & {
  value: Label & {
    msg: (typeof MSG_STRINGS_COMMON)['CheckSucceeded'];
  };
};

type EndingLog = CheckFailedLog | CheckSucceededLog;

export type CheckLogs = [StartingLog, ...LabelsWithTime[], EndingLog];
