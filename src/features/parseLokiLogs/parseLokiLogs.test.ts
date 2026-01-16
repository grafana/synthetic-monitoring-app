import { FieldType } from '@grafana/data';
import { flattenLogs, normalizeLokiDataFrame, parseLokiLogs, sortLogs } from 'features/parseLokiLogs/parseLokiLogs';

import {
  ID,
  Labels,
  LabelTypes,
  Line,
  LineNew,
  LokiDataFrame,
  LokiFieldNames,
  LokiFieldNamesNew,
  LokiFieldsNew,
  LokiFieldsOld,
  ParsedLokiRecord,
  Time,
  TimeNew,
  TsNs,
  TsNsNew,
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
        [LokiFieldNames.TsNs]: 1000000,
        [LokiFieldNames.Time]: 1000,
        [LokiFieldNames.Line]: 'log 1',
        [LokiFieldNames.Labels]: { msg: 'msg 1' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.ID]: 'id1',
      },
      {
        [LokiFieldNames.TsNs]: 2000000,
        [LokiFieldNames.Time]: 2000,
        [LokiFieldNames.Line]: 'log 2',
        [LokiFieldNames.Labels]: { msg: 'msg 2' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.ID]: 'id2',
      },
      {
        [LokiFieldNames.TsNs]: 3000000,
        [LokiFieldNames.Time]: 3000,
        [LokiFieldNames.Line]: 'log 3',
        [LokiFieldNames.Labels]: { msg: 'msg 3' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.ID]: 'id3',
      },
    ]);
  });

  it(`should parse loki logs from new schema and sort them by tsNs`, () => {
    const newSchemaFields = buildLokiFieldsNew({
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
        [LokiFieldNames.TsNs]: 1000000,
        [LokiFieldNames.Time]: 1000,
        [LokiFieldNames.Line]: 'log 1',
        [LokiFieldNames.Labels]: { msg: 'msg 1' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.ID]: 'id1',
      },
      {
        [LokiFieldNames.TsNs]: 2000000,
        [LokiFieldNames.Time]: 2000,
        [LokiFieldNames.Line]: 'log 2',
        [LokiFieldNames.Labels]: { msg: 'msg 2' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.ID]: 'id2',
      },
      {
        [LokiFieldNames.TsNs]: 3000000,
        [LokiFieldNames.Time]: 3000,
        [LokiFieldNames.Line]: 'log 3',
        [LokiFieldNames.Labels]: { msg: 'msg 3' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.ID]: 'id3',
      },
    ]);
  });

  it(`should parse loki logs from new schema without tsNs and derive tsNs from timestamp`, () => {
    const newSchemaFieldsWithoutTsNs = buildLokiFieldsNewWithoutTsNs({
      timeValues: [2000, 1000, 3000],
      lineValues: ['log 2', 'log 1', 'log 3'],
      labelsValues: [{ msg: 'msg 2' }, { msg: 'msg 1' }, { msg: 'msg 3' }],
      labelTypesValues: [{}, {}, {}],
      idValues: ['id2', 'id1', 'id3'],
    });

    const res = parseLokiLogs({
      fields: newSchemaFieldsWithoutTsNs as unknown as LokiFieldsNew<Record<string, string>, Record<string, string>>,
      length: newSchemaFieldsWithoutTsNs.length,
    });

    expect(res).toEqual([
      {
        [LokiFieldNames.TsNs]: 1000000000, // 1000 * 1000000
        [LokiFieldNames.Time]: 1000,
        [LokiFieldNames.Line]: 'log 1',
        [LokiFieldNames.Labels]: { msg: 'msg 1' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.ID]: 'id1',
      },
      {
        [LokiFieldNames.TsNs]: 2000000000, // 2000 * 1000000
        [LokiFieldNames.Time]: 2000,
        [LokiFieldNames.Line]: 'log 2',
        [LokiFieldNames.Labels]: { msg: 'msg 2' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.ID]: 'id2',
      },
      {
        [LokiFieldNames.TsNs]: 3000000000, // 3000 * 1000000
        [LokiFieldNames.Time]: 3000,
        [LokiFieldNames.Line]: 'log 3',
        [LokiFieldNames.Labels]: { msg: 'msg 3' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.ID]: 'id3',
      },
    ]);
  });
});

describe(`normalizeLokiDataFrame`, () => {
  it(`should normalize new schema fields (timestamp → Time, body → Line)`, () => {
    const newSchemaFrame: LokiDataFrame<Record<string, string>, Record<string, string>> = {
      fields: buildLokiFieldsNew({
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
    expect(normalized.fields[1].name).toBe(LokiFieldNames.Time);
    expect(normalized.fields[2].name).toBe(LokiFieldNames.Line);
    expect(normalized.fields[3].name).toBe(LokiFieldNames.TsNs);
    expect(normalized.fields[4].name).toBe(LokiFieldNames.LabelTypes);
    expect(normalized.fields[5].name).toBe(LokiFieldNames.ID);

    // Verify values are preserved
    expect(normalized.fields[1].values).toEqual([1000, 2000]);
    expect(normalized.fields[2].values).toEqual(['log 1', 'log 2']);
    expect(normalized.fields[3].values).toEqual(['1000000', '2000000']);
  });

  it(`should leave old schema fields unchanged`, () => {
    const oldSchemaFrame: LokiDataFrame<Record<string, string>, Record<string, string>> = {
      fields: INPUT_LOGS_OLD,
      length: INPUT_LOGS_OLD.length,
    };

    const normalized = normalizeLokiDataFrame(oldSchemaFrame);

    expect(normalized.fields).toEqual(oldSchemaFrame.fields);
    expect(normalized.fields[1].name).toBe(LokiFieldNames.Time);
    expect(normalized.fields[2].name).toBe(LokiFieldNames.Line);
  });

  it(`should handle new schema without tsNs field`, () => {
    const newSchemaFrameWithoutTsNs: LokiDataFrame<Record<string, string>, Record<string, string>> = {
      fields: buildLokiFieldsNewWithoutTsNs({
        timeValues: [1000, 2000],
        lineValues: ['log 1', 'log 2'],
        labelsValues: [{ msg: 'msg 1' }, { msg: 'msg 2' }],
        labelTypesValues: [{}, {}],
        idValues: ['id1', 'id2'],
      }) as unknown as LokiFieldsNew<Record<string, string>, Record<string, string>>,
      length: 2,
    };

    const normalized = normalizeLokiDataFrame(newSchemaFrameWithoutTsNs);

    expect(normalized.fields[0].name).toBe(LokiFieldNames.Labels);
    expect(normalized.fields[1].name).toBe(LokiFieldNames.Time);
    expect(normalized.fields[2].name).toBe(LokiFieldNames.Line);
    expect(normalized.fields[3].name).toBe(LokiFieldNames.TsNs);
    expect(normalized.fields[4].name).toBe(LokiFieldNames.LabelTypes);
    expect(normalized.fields[5].name).toBe(LokiFieldNames.ID);
    // tsNs field should be created with undefined values
    expect(normalized.fields[3].values).toEqual([undefined, undefined]);
  });
});

describe(`sortLogs`, () => {
  it(`should sort logs by tsNS`, () => {
    const FIRST_ENTRY = { tsNs: 2000000 } as unknown as ParsedLokiRecord<unknown, unknown>;
    const SECOND_ENTRY = { tsNs: 1000000 } as unknown as ParsedLokiRecord<unknown, unknown>;
    const THIRD_ENTRY = { tsNs: 3000000 } as unknown as ParsedLokiRecord<unknown, unknown>;

    const sortedLogs = sortLogs([FIRST_ENTRY, SECOND_ENTRY, THIRD_ENTRY]);
    expect(sortedLogs).toEqual([SECOND_ENTRY, FIRST_ENTRY, THIRD_ENTRY]);
  });
});

describe(`flattenLogs`, () => {
  it(`should flatten the logs from old schema and convert tsNs to number by default`, () => {
    const orderedLogs = flattenLogs(INPUT_LOGS_OLD);

    expect(orderedLogs).toEqual([
      {
        [LokiFieldNames.TsNs]: 2000000,
        [LokiFieldNames.Time]: 2000,
        [LokiFieldNames.Line]: 'log 2',
        [LokiFieldNames.Labels]: { msg: 'msg 2' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.ID]: 'id2',
      },
      {
        [LokiFieldNames.TsNs]: 1000000,
        [LokiFieldNames.Time]: 1000,
        [LokiFieldNames.Line]: 'log 1',
        [LokiFieldNames.Labels]: { msg: 'msg 1' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.ID]: 'id1',
      },
      {
        [LokiFieldNames.TsNs]: 3000000,
        [LokiFieldNames.Time]: 3000,
        [LokiFieldNames.Line]: 'log 3',
        [LokiFieldNames.Labels]: { msg: 'msg 3' },
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.ID]: 'id3',
      },
    ]);
  });

  it(`should apply custom parser`, () => {
    const HARDCODED_LABELS_VALUE = 'hardcoded';

    const parser = {
      [LokiFieldNames.Labels]: (value: Record<string, string>) => HARDCODED_LABELS_VALUE,
    };

    const orderedLogs = flattenLogs(INPUT_LOGS_OLD, parser);

    expect(orderedLogs).toEqual([
      {
        [LokiFieldNames.TsNs]: 2000000,
        [LokiFieldNames.Time]: 2000,
        [LokiFieldNames.Line]: 'log 2',
        [LokiFieldNames.Labels]: HARDCODED_LABELS_VALUE,
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.ID]: 'id2',
      },
      {
        [LokiFieldNames.TsNs]: 1000000,
        [LokiFieldNames.Time]: 1000,
        [LokiFieldNames.Line]: 'log 1',
        [LokiFieldNames.Labels]: HARDCODED_LABELS_VALUE,
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.ID]: 'id1',
      },
      {
        [LokiFieldNames.TsNs]: 3000000,
        [LokiFieldNames.Time]: 3000,
        [LokiFieldNames.Line]: 'log 3',
        [LokiFieldNames.Labels]: HARDCODED_LABELS_VALUE,
        [LokiFieldNames.LabelTypes]: {},
        [LokiFieldNames.ID]: 'id3',
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

  const time: Time = {
    name: LokiFieldNames.Time,
    type: FieldType.time,
    values: timeValues,
    config: {},
    typeInfo: { frame: 'time.Time' },
    nanos: tsNsValues.map((v) => Number(v)),
  };

  const line: Line = {
    name: LokiFieldNames.Line,
    type: FieldType.string,
    values: lineValues,
    config: {},
    typeInfo: { frame: 'string' },
  };

  const tsNs: TsNs = {
    name: LokiFieldNames.TsNs,
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
    name: LokiFieldNames.ID,
    type: FieldType.string,
    values: idValues,
    config: {},
    typeInfo: { frame: 'string' },
  };

  return [labels, time, line, tsNs, labelTypes, id];
}

function buildLokiFieldsNew({
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
}): LokiFieldsNew<Record<string, string>, Record<string, string>> {
  const labels: Labels<Record<string, string>> = {
    name: LokiFieldNames.Labels,
    type: FieldType.other,
    values: labelsValues,
    config: {},
    typeInfo: { frame: 'json.RawMessage' },
  };

  const time: TimeNew = {
    name: LokiFieldNamesNew.Time,
    type: FieldType.time,
    values: timeValues,
    config: {},
    typeInfo: { frame: 'time.Time' },
    nanos: tsNsValues.map((v) => Number(v)),
  };

  const line: LineNew = {
    name: LokiFieldNamesNew.Line,
    type: FieldType.string,
    values: lineValues,
    config: {},
    typeInfo: { frame: 'string' },
  };

  const tsNs: TsNsNew = {
    name: LokiFieldNamesNew.TsNs,
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
    name: LokiFieldNames.ID,
    type: FieldType.string,
    values: idValues,
    config: {},
    typeInfo: { frame: 'string' },
  };

  return [labels, time, line, tsNs, labelTypes, id];
}

function buildLokiFieldsNewWithoutTsNs({
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
}): [Labels<Record<string, string>>, TimeNew, LineNew, LabelTypes<Record<string, string>>, ID] {
  const labels: Labels<Record<string, string>> = {
    name: LokiFieldNames.Labels,
    type: FieldType.other,
    values: labelsValues,
    config: {},
    typeInfo: { frame: 'json.RawMessage' },
  };

  const time: TimeNew = {
    name: LokiFieldNamesNew.Time,
    type: FieldType.time,
    values: timeValues,
    config: {},
    typeInfo: { frame: 'time.Time' },
    nanos: [],
  };

  const line: LineNew = {
    name: LokiFieldNamesNew.Line,
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
    name: LokiFieldNames.ID,
    type: FieldType.string,
    values: idValues,
    config: {},
    typeInfo: { frame: 'string' },
  };

  // Return 5-element array (without tsNs) - will be cast when used
  return [labels, time, line, labelTypes, id];
}
