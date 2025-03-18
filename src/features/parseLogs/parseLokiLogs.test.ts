import { FieldType } from '@grafana/data';
import { flattenLogs } from 'features/parseLogs/parseLokiLogs';

import { Labels, LokiFieldNames, LokiFields, Time, TsNs } from 'features/parseLogs/parseLogs.types';

// describe('parseLokiLogs', () => {
//   it('should parse loki logs', () => {
//     const logs = parseLokiLogs(logs);
//   });
// });

describe(`flattenLogs`, () => {
  it(`should assign time to logs and sort them`, () => {
    const lokiFields = constructLokiFields({
      tsNsValues: [`2000000`, `1000000`, `3000000`],
      labelsValues: [{ msg: 'msg 2' }, { msg: 'msg 1' }, { msg: 'msg 3' }],
    });
    const orderedLogs = flattenLogs(lokiFields);

    expect(orderedLogs).toEqual([
      { time: 1000000, value: { msg: 'msg 1' } },
      { time: 2000000, value: { msg: 'msg 2' } },
      { time: 3000000, value: { msg: 'msg 3' } },
    ]);
  });
});

function constructLokiFields({ tsNsValues, labelsValues }: { tsNsValues: string[]; labelsValues: unknown[] }) {
  const time: Time = {
    name: LokiFieldNames.Time,
    type: FieldType.time,
    values: [],
    nanos: [],
    config: {},
    typeInfo: {
      frame: 'time.Time',
    },
  };
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

  return [labels, time, tsNs] as unknown as LokiFields<unknown, unknown>;
}
