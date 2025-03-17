import { assignTime } from 'features/parseLogs/parseLokiLogs';

// describe('parseLokiLogs', () => {
//   it('should parse loki logs', () => {
//     const logs = parseLokiLogs(logs);
//   });
// });

describe(`assignTime`, () => {
  it(`should assign time to logs and sort them`, () => {
    const time = {
      values: [2, 1, 3],
      nanos: [0, 0, 0],
    };
    const labels = [{ msg: 'msg 2' }, { msg: 'msg 1' }, { msg: 'msg 3' }];

    const orderedLogs = assignTime(time, labels);

    expect(orderedLogs).toEqual([
      { time: 1000000, value: { msg: 'msg 1' } },
      { time: 2000000, value: { msg: 'msg 2' } },
      { time: 3000000, value: { msg: 'msg 3' } },
    ]);
  });

  it(`should use nano second-precision`, () => {
    const time = {
      values: [1, 1, 3],
      nanos: [2000000, 1000000, 1000000],
    };
    const labels = [{ msg: 'msg 2' }, { msg: 'msg 1' }, { msg: 'msg 3' }];

    const orderedLogs = assignTime(time, labels);

    expect(orderedLogs).toEqual([
      { time: 2000000, value: { msg: 'msg 1' } },
      { time: 3000000, value: { msg: 'msg 2' } },
      { time: 4000000, value: { msg: 'msg 3' } },
    ]);
  });
});
