import { FieldType } from '@grafana/data';
import { flattenLogs, parseLokiLogs, sortLogs } from 'features/parseLogs/parseLokiLogs';

import { Labels, LokiFieldNames, LokiFields, ParsedLokiRecord, TsNs } from 'features/parseLogs/parseLogs.types';

const INPUT_LOGS = constructLokiFields({
  tsNsValues: [`2000000`, `1000000`, `3000000`],
  labelsValues: [{ msg: 'msg 2' }, { msg: 'msg 1' }, { msg: 'msg 3' }],
});

describe(`parseLokiLogs`, () => {
  it(`should parse loki logs and sort them by tsNs`, () => {
    const res = parseLokiLogs({
      fields: INPUT_LOGS,
      length: INPUT_LOGS.length,
    });
    expect(res).toEqual([
      { tsNs: 1000000, labels: { msg: 'msg 1' } },
      { tsNs: 2000000, labels: { msg: 'msg 2' } },
      { tsNs: 3000000, labels: { msg: 'msg 3' } },
    ]);
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
  it(`should flatten the logs and convert tsNs to number by default`, () => {
    const orderedLogs = flattenLogs(INPUT_LOGS);

    expect(orderedLogs).toEqual([
      { tsNs: 2000000, labels: { msg: 'msg 2' } },
      { tsNs: 1000000, labels: { msg: 'msg 1' } },
      { tsNs: 3000000, labels: { msg: 'msg 3' } },
    ]);
  });

  it(`should apply custom parser`, () => {
    const HARDCODED_LABELS_VALUE = 'hardcoded';

    const parser = {
      [LokiFieldNames.Labels]: (value: Record<string, string>) => HARDCODED_LABELS_VALUE,
    };

    const orderedLogs = flattenLogs(INPUT_LOGS, parser);

    expect(orderedLogs).toEqual([
      { tsNs: 2000000, labels: HARDCODED_LABELS_VALUE },
      { tsNs: 1000000, labels: HARDCODED_LABELS_VALUE },
      { tsNs: 3000000, labels: HARDCODED_LABELS_VALUE },
    ]);
  });
});

function constructLokiFields({ tsNsValues, labelsValues }: { tsNsValues: string[]; labelsValues: unknown[] }) {
  const labels: Labels<unknown> = {
    name: LokiFieldNames.Labels,
    type: FieldType.other,
    values: labelsValues,
    config: {},
    typeInfo: { frame: 'json.RawMessage' },
  };

  const tsNs: TsNs = {
    name: LokiFieldNames.TsNs,
    type: FieldType.string,
    values: tsNsValues,
    config: {},
    typeInfo: { frame: 'string' },
  };

  return [labels, tsNs] as unknown as LokiFields<unknown, unknown>;
}
