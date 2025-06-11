import { buildTimepoints } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

const DEFAULT_TIMEPOINT = {
  probes: [],
  uptimeValue: -1,
  maxProbeDuration: -1,
};

describe(`buildTimepointsInRange`, () => {
  it(`should build timepoints in range for a simple time range`, () => {
    const from = 0;
    const to = 1000;
    const checkConfigs = [{ frequency: 1000, date: 0 }];
    const timepoints = buildTimepoints({ from, to, checkConfigs });

    expect(timepoints).toEqual({
      '1000': {
        ...DEFAULT_TIMEPOINT,
        adjustedTime: 1000,
        frequency: 1000,
        index: 0,
      },
      '0': {
        ...DEFAULT_TIMEPOINT,
        adjustedTime: 0,
        frequency: 1000,
        index: 1,
      },
    });
  });

  it(`should build timepoints in range for a time range with multiple check configs - neat`, () => {
    const from = 0;
    const to = 6000;
    const checkConfigs = [
      { frequency: 1000, date: 0 },
      { frequency: 2000, date: 1001 },
    ];
    const timepoints = buildTimepoints({ from, to, checkConfigs });

    expect(timepoints).toEqual({
      '6000': {
        ...DEFAULT_TIMEPOINT,
        adjustedTime: 6000,
        frequency: 2000,
        index: 0,
      },
      '4000': {
        ...DEFAULT_TIMEPOINT,
        adjustedTime: 4000,
        frequency: 2000,
        index: 1,
      },
      '2000': {
        ...DEFAULT_TIMEPOINT,
        adjustedTime: 2000,
        frequency: 2000,
        index: 2,
      },
      '0': {
        ...DEFAULT_TIMEPOINT,
        adjustedTime: 0,
        frequency: 1000,
        index: 3,
      },
    });
  });

  // 10000, 7000, 4000, 2000
  it(`should build timepoints in range for a time range with multiple check configs - messy`, () => {
    const from = 0;
    const to = 9999;
    const checkConfigs = [
      { frequency: 2000, date: 0 },
      { frequency: 3000, date: 3999 },
    ];
    const timepoints = buildTimepoints({ from, to, checkConfigs });

    expect(timepoints).toEqual({
      '10000': {
        ...DEFAULT_TIMEPOINT,
        adjustedTime: 10000,
        frequency: 3000,
        index: 0,
      },
      '7000': {
        ...DEFAULT_TIMEPOINT,
        adjustedTime: 7000,
        frequency: 3000,
        index: 1,
      },
      '4000': {
        ...DEFAULT_TIMEPOINT,
        adjustedTime: 4000,
        frequency: 2000,
        index: 2,
      },
      '2000': {
        ...DEFAULT_TIMEPOINT,
        adjustedTime: 2000,
        frequency: 2000,
        index: 3,
      },
      '0': {
        ...DEFAULT_TIMEPOINT,
        adjustedTime: 0,
        frequency: 2000,
        index: 4,
      },
    });
  });
});
