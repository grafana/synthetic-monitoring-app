import { FieldType } from '@grafana/data';
import { flattenLogs, normalizeLokiDataFrame, parseLokiLogs, sortLogs } from 'features/parseLokiLogs/parseLokiLogs';

import {
  Body,
  ID,
  Labels,
  LabelTypes,
  LineOld,
  LokiDataFrame,
  LokiFieldNames,
  LokiFieldNamesOld,
  LokiFields,
  LokiFieldsOld,
  ParsedLokiRecord,
  TimeOld,
  TimeStamp,
  TsNsOld,
} from 'features/parseLokiLogs/parseLokiLogs.types';

const INPUT_LOGS_OLD = buildLokiFieldsOld({
  timeValues: [2000, 1000, 3000],
  lineValues: ['log 2', 'log 1', 'log 3'],
  tsNsValues: [`2000000`, `1000000`, `3000000`],
  labelsValues: [{ msg: 'msg 2' }, { msg: 'msg 1' }, { msg: 'msg 3' }],
  labelTypesValues: [{}, {}, {}],
  idValues: ['id2', 'id1', 'id3'],
});

describe(`parseLokiLogs`, () => {
  it(`should parse loki logs from old schema and sort them by tsNs`, () => {
    const res = parseLokiLogs({
      fields: INPUT_LOGS_OLD,
      length: INPUT_LOGS_OLD.length,
    });
    expect(res).toEqual([
      {
        nanos: 1000000,
        [LokiFieldNames.TimeStamp]: 1000,
        [LokiFieldNames.Body]: 'log 1',
        [LokiFieldNames.Labels]: { msg: 'msg 1' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.Id]: 'id1',
      },
      {
        nanos: 2000000,
        [LokiFieldNames.TimeStamp]: 2000,
        [LokiFieldNames.Body]: 'log 2',
        [LokiFieldNames.Labels]: { msg: 'msg 2' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.Id]: 'id2',
      },
      {
        nanos: 3000000,
        [LokiFieldNames.TimeStamp]: 3000,
        [LokiFieldNames.Body]: 'log 3',
        [LokiFieldNames.Labels]: { msg: 'msg 3' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.Id]: 'id3',
      },
    ]);
  });

  it(`should parse loki logs from new schema and sort them by tsNs`, () => {
    const newSchemaFields = buildLokiFields({
      timeValues: [2000, 1000, 3000],
      lineValues: ['log 2', 'log 1', 'log 3'],
      tsNsValues: [`2000000`, `1000000`, `3000000`],
      labelsValues: [{ msg: 'msg 2' }, { msg: 'msg 1' }, { msg: 'msg 3' }],
      labelTypesValues: [{}, {}, {}],
      idValues: ['id2', 'id1', 'id3'],
    });

    const res = parseLokiLogs({
      fields: newSchemaFields,
      length: newSchemaFields.length,
    });

    expect(res).toEqual([
      {
        nanos: 1000000,
        [LokiFieldNames.TimeStamp]: 1000,
        [LokiFieldNames.Body]: 'log 1',
        [LokiFieldNames.Labels]: { msg: 'msg 1' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.Id]: 'id1',
      },
      {
        nanos: 2000000,
        [LokiFieldNames.TimeStamp]: 2000,
        [LokiFieldNames.Body]: 'log 2',
        [LokiFieldNames.Labels]: { msg: 'msg 2' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.Id]: 'id2',
      },
      {
        nanos: 3000000,
        [LokiFieldNames.TimeStamp]: 3000,
        [LokiFieldNames.Body]: 'log 3',
        [LokiFieldNames.Labels]: { msg: 'msg 3' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.Id]: 'id3',
      },
    ]);
  });

  it(`should parse loki logs from new schema without tsNs and derive tsNs from timestamp`, () => {
    const newSchemaFieldsWithoutTsNs = buildLokiFieldsWithoutTsNs({
      timeValues: [2000, 1000, 3000],
      lineValues: ['log 2', 'log 1', 'log 3'],
      labelsValues: [{ msg: 'msg 2' }, { msg: 'msg 1' }, { msg: 'msg 3' }],
      labelTypesValues: [{}, {}, {}],
      idValues: ['id2', 'id1', 'id3'],
    });

    const res = parseLokiLogs({
      fields: newSchemaFieldsWithoutTsNs as unknown as LokiFields<Record<string, string>, Record<string, string>>,
      length: newSchemaFieldsWithoutTsNs.length,
    });

    expect(res).toEqual([
      {
        nanos: 1000000000, // 1000 * 1000000
        [LokiFieldNames.TimeStamp]: 1000,
        [LokiFieldNames.Body]: 'log 1',
        [LokiFieldNames.Labels]: { msg: 'msg 1' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.Id]: 'id1',
      },
      {
        nanos: 2000000000, // 2000 * 1000000
        [LokiFieldNames.TimeStamp]: 2000,
        [LokiFieldNames.Body]: 'log 2',
        [LokiFieldNames.Labels]: { msg: 'msg 2' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.Id]: 'id2',
      },
      {
        nanos: 3000000000, // 3000 * 1000000
        [LokiFieldNames.TimeStamp]: 3000,
        [LokiFieldNames.Body]: 'log 3',
        [LokiFieldNames.Labels]: { msg: 'msg 3' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.Id]: 'id3',
      },
    ]);
  });
});

describe(`normalizeLokiDataFrame`, () => {
  it(`should leave new schema fields unchanged (timestamp, body)`, () => {
    const newSchemaFrame: LokiDataFrame<Record<string, string>, Record<string, string>> = {
      fields: buildLokiFields({
        timeValues: [1000, 2000],
        lineValues: ['log 1', 'log 2'],
        tsNsValues: ['1000000', '2000000'],
        labelsValues: [{ msg: 'msg 1' }, { msg: 'msg 2' }],
        labelTypesValues: [{}, {}],
        idValues: ['id1', 'id2'],
      }),
      length: 2,
    };

    const normalized = normalizeLokiDataFrame(newSchemaFrame);

    expect(normalized.fields[0].name).toBe(LokiFieldNames.Labels);
    expect(normalized.fields[1].name).toBe(LokiFieldNames.TimeStamp);
    expect(normalized.fields[2].name).toBe(LokiFieldNames.Body);
    expect(normalized.fields[3].name).toBe(LokiFieldNames.LabelTypes);
    expect(normalized.fields[4].name).toBe(LokiFieldNames.Id);

    // Verify values are preserved
    expect(normalized.fields[1].values).toEqual([1000, 2000]);
    expect(normalized.fields[2].values).toEqual(['log 1', 'log 2']);
    // Verify nanos is on timestamp field
    expect((normalized.fields[1] as TimeStamp).nanos).toEqual([1000000, 2000000]);
  });

  it(`should normalize old schema fields to new schema (Time → timestamp, Line → body, TsNs → timestamp.nanos)`, () => {
    const oldSchemaFrame: LokiDataFrame<Record<string, string>, Record<string, string>> = {
      fields: INPUT_LOGS_OLD,
      length: INPUT_LOGS_OLD.length,
    };

    const normalized = normalizeLokiDataFrame(oldSchemaFrame);

    expect(normalized.fields[0].name).toBe(LokiFieldNames.Labels);
    expect(normalized.fields[1].name).toBe(LokiFieldNames.TimeStamp);
    expect(normalized.fields[2].name).toBe(LokiFieldNames.Body);
    expect(normalized.fields[3].name).toBe(LokiFieldNames.LabelTypes);
    expect(normalized.fields[4].name).toBe(LokiFieldNames.Id);
    // Verify nanos is populated on timestamp field from old schema's tsNs
    expect((normalized.fields[1] as TimeStamp).nanos).toEqual([2000000, 1000000, 3000000]);
  });

  it(`should handle new schema without nanos`, () => {
    const newSchemaFrameWithoutTsNs: LokiDataFrame<Record<string, string>, Record<string, string>> = {
      fields: buildLokiFieldsWithoutTsNs({
        timeValues: [1000, 2000],
        lineValues: ['log 1', 'log 2'],
        labelsValues: [{ msg: 'msg 1' }, { msg: 'msg 2' }],
        labelTypesValues: [{}, {}],
        idValues: ['id1', 'id2'],
      }) as unknown as LokiFields<Record<string, string>, Record<string, string>>,
      length: 2,
    };

    const normalized = normalizeLokiDataFrame(newSchemaFrameWithoutTsNs);

    expect(normalized.fields[0].name).toBe(LokiFieldNames.Labels);
    expect(normalized.fields[1].name).toBe(LokiFieldNames.TimeStamp);
    expect(normalized.fields[2].name).toBe(LokiFieldNames.Body);
    expect(normalized.fields[3].name).toBe(LokiFieldNames.LabelTypes);
    expect(normalized.fields[4].name).toBe(LokiFieldNames.Id);
    // nanos should be empty array if not provided
    expect((normalized.fields[1] as TimeStamp).nanos).toEqual([]);
  });
});

describe(`sortLogs`, () => {
  it(`should sort logs by timestamp + nanos`, () => {
    const FIRST_ENTRY = { [LokiFieldNames.TimeStamp]: 2000, nanos: 0 } as unknown as ParsedLokiRecord<unknown, unknown>;
    const SECOND_ENTRY = { [LokiFieldNames.TimeStamp]: 1000, nanos: 0 } as unknown as ParsedLokiRecord<
      unknown,
      unknown
    >;
    const THIRD_ENTRY = { [LokiFieldNames.TimeStamp]: 3000, nanos: 0 } as unknown as ParsedLokiRecord<unknown, unknown>;

    const sortedLogs = sortLogs([FIRST_ENTRY, SECOND_ENTRY, THIRD_ENTRY]);
    expect(sortedLogs).toEqual([SECOND_ENTRY, FIRST_ENTRY, THIRD_ENTRY]);
  });
});

describe(`flattenLogs`, () => {
  it(`should flatten the logs from old schema and convert tsNs to number by default`, () => {
    // Normalize old schema to new schema first (as parseLokiLogs does)
    const normalizedFrame = normalizeLokiDataFrame({
      fields: INPUT_LOGS_OLD,
      length: INPUT_LOGS_OLD.length,
    });
    const orderedLogs = flattenLogs(
      normalizedFrame.fields as LokiFields<Record<string, string>, Record<string, string>>
    );

    expect(orderedLogs).toEqual([
      {
        nanos: 2000000,
        [LokiFieldNames.TimeStamp]: 2000,
        [LokiFieldNames.Body]: 'log 2',
        [LokiFieldNames.Labels]: { msg: 'msg 2' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.Id]: 'id2',
      },
      {
        nanos: 1000000,
        [LokiFieldNames.TimeStamp]: 1000,
        [LokiFieldNames.Body]: 'log 1',
        [LokiFieldNames.Labels]: { msg: 'msg 1' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.Id]: 'id1',
      },
      {
        nanos: 3000000,
        [LokiFieldNames.TimeStamp]: 3000,
        [LokiFieldNames.Body]: 'log 3',
        [LokiFieldNames.Labels]: { msg: 'msg 3' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.Id]: 'id3',
      },
    ]);
  });

  it(`should apply custom parser`, () => {
    const HARDCODED_LABELS_VALUE = 'hardcoded';

    const parser = {
      [LokiFieldNames.Labels]: (value: Record<string, string>) => HARDCODED_LABELS_VALUE,
    } as Partial<Record<LokiFieldNamesOld | LokiFieldNames, (value: any) => any>>;

    // Normalize old schema to new schema first (as parseLokiLogs does)
    const normalizedFrame = normalizeLokiDataFrame({
      fields: INPUT_LOGS_OLD,
      length: INPUT_LOGS_OLD.length,
    });
    const orderedLogs = flattenLogs(
      normalizedFrame.fields as LokiFields<Record<string, string>, Record<string, string>>,
      parser
    );

    expect(orderedLogs).toEqual([
      {
        nanos: 2000000,
        [LokiFieldNames.TimeStamp]: 2000,
        [LokiFieldNames.Body]: 'log 2',
        [LokiFieldNames.Labels]: HARDCODED_LABELS_VALUE,
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.Id]: 'id2',
      },
      {
        nanos: 1000000,
        [LokiFieldNames.TimeStamp]: 1000,
        [LokiFieldNames.Body]: 'log 1',
        [LokiFieldNames.Labels]: HARDCODED_LABELS_VALUE,
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.Id]: 'id1',
      },
      {
        nanos: 3000000,
        [LokiFieldNames.TimeStamp]: 3000,
        [LokiFieldNames.Body]: 'log 3',
        [LokiFieldNames.Labels]: HARDCODED_LABELS_VALUE,
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.Id]: 'id3',
      },
    ]);
  });
});

function buildLokiFieldsOld({
  timeValues,
  lineValues,
  tsNsValues,
  labelsValues,
  labelTypesValues,
  idValues,
}: {
  timeValues: number[];
  lineValues: string[];
  tsNsValues: string[];
  labelsValues: Array<Record<string, string>>;
  labelTypesValues: Array<Record<string, string>>;
  idValues: string[];
}): LokiFieldsOld<Record<string, string>, Record<string, string>> {
  const labels: Labels<Record<string, string>> = {
    name: LokiFieldNames.Labels,
    type: FieldType.other,
    values: labelsValues,
    config: {},
    typeInfo: { frame: 'json.RawMessage' },
  };

  const time: TimeOld = {
    name: LokiFieldNamesOld.Time,
    type: FieldType.time,
    values: timeValues,
    config: {},
    typeInfo: { frame: 'time.Time' },
    nanos: tsNsValues.map((v) => Number(v)),
  };

  const line: LineOld = {
    name: LokiFieldNamesOld.Line,
    type: FieldType.string,
    values: lineValues,
    config: {},
    typeInfo: { frame: 'string' },
  };

  const tsNs: TsNsOld = {
    name: LokiFieldNamesOld.TsNs,
    type: FieldType.string,
    values: tsNsValues,
    config: {},
    typeInfo: { frame: 'string' },
  };

  const labelTypes: LabelTypes<Record<string, string>> = {
    name: LokiFieldNames.LabelTypes,
    type: FieldType.other,
    values: labelTypesValues,
    config: { custom: { hidden: true } },
    typeInfo: { frame: 'json.RawMessage' },
  };

  const id: ID = {
    name: LokiFieldNames.Id,
    type: FieldType.string,
    values: idValues,
    config: {},
    typeInfo: { frame: 'string' },
  };

  return [labels, time, line, tsNs, labelTypes, id];
}

function buildLokiFields({
  timeValues,
  lineValues,
  tsNsValues,
  labelsValues,
  labelTypesValues,
  idValues,
}: {
  timeValues: number[];
  lineValues: string[];
  tsNsValues: string[];
  labelsValues: Array<Record<string, string>>;
  labelTypesValues: Array<Record<string, string>>;
  idValues: string[];
}): LokiFields<Record<string, string>, Record<string, string>> {
  const labels: Labels<Record<string, string>> = {
    name: LokiFieldNames.Labels,
    type: FieldType.other,
    values: labelsValues,
    config: {},
    typeInfo: { frame: 'json.RawMessage' },
  };

  const time: TimeStamp = {
    name: LokiFieldNames.TimeStamp,
    type: FieldType.time,
    values: timeValues,
    config: {},
    typeInfo: { frame: 'time.Time' },
    nanos: tsNsValues.map((v) => Number(v)),
  };

  const line: Body = {
    name: LokiFieldNames.Body,
    type: FieldType.string,
    values: lineValues,
    config: {},
    typeInfo: { frame: 'string' },
  };

  const labelTypes: LabelTypes<Record<string, string>> = {
    name: LokiFieldNames.LabelTypes,
    type: FieldType.other,
    values: labelTypesValues,
    config: { custom: { hidden: true } },
    typeInfo: { frame: 'json.RawMessage' },
  };

  const id: ID = {
    name: LokiFieldNames.Id,
    type: FieldType.string,
    values: idValues,
    config: {},
    typeInfo: { frame: 'string' },
  };

  return [labels, time, line, labelTypes, id];
}

function buildLokiFieldsWithoutTsNs({
  timeValues,
  lineValues,
  labelsValues,
  labelTypesValues,
  idValues,
}: {
  timeValues: number[];
  lineValues: string[];
  labelsValues: Array<Record<string, string>>;
  labelTypesValues: Array<Record<string, string>>;
  idValues: string[];
}): [Labels<Record<string, string>>, TimeStamp, Body, LabelTypes<Record<string, string>>, ID] {
  const labels: Labels<Record<string, string>> = {
    name: LokiFieldNames.Labels,
    type: FieldType.other,
    values: labelsValues,
    config: {},
    typeInfo: { frame: 'json.RawMessage' },
  };

  const time: TimeStamp = {
    name: LokiFieldNames.TimeStamp,
    type: FieldType.time,
    values: timeValues,
    config: {},
    typeInfo: { frame: 'time.Time' },
    nanos: [],
  };

  const line: Body = {
    name: LokiFieldNames.Body,
    type: FieldType.string,
    values: lineValues,
    config: {},
    typeInfo: { frame: 'string' },
  };

  const labelTypes: LabelTypes<Record<string, string>> = {
    name: LokiFieldNames.LabelTypes,
    type: FieldType.other,
    values: labelTypesValues,
    config: { custom: { hidden: true } },
    typeInfo: { frame: 'json.RawMessage' },
  };

  const id: ID = {
    name: LokiFieldNames.Id,
    type: FieldType.string,
    values: idValues,
    config: {},
    typeInfo: { frame: 'string' },
  };

  // Return 5-element array (without tsNs) - will be cast when used
  return [labels, time, line, labelTypes, id];
}
