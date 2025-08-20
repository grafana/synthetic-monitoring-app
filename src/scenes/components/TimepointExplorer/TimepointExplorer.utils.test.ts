import { db } from 'test/db';
import { succeededLogFactory } from 'test/db/checkLogs';

import {
  MiniMapPage,
  MiniMapPages,
  MiniMapSection,
  StatefulTimepoint,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  buildlistLogsMap,
  buildTimepoints,
  findNearest,
  getMiniMapPages,
  getMiniMapSections,
  getPendingProbes,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

describe(`getMiniMapPages`, () => {
  it(`should not get into an infinite loop`, () => {});

  it(`should return the correct mini map pages`, () => {
    const timepointsDisplayCount = 10;
    const miniMapPages = getMiniMapPages(63, timepointsDisplayCount, 6);

    expect(miniMapPages).toEqual([
      [3, 62],
      [0, 2],
    ]);
  });
});

describe(`getMiniMapSections`, () => {
  it(`should return the correct mini map sections`, () => {
    const miniMapPage: MiniMapPage = [0, 9];
    const timepointsDisplayCount = 10;
    const miniMapSections = getMiniMapSections(miniMapPage, timepointsDisplayCount);
    expect(miniMapSections).toEqual([[0, 9]]);
  });

  it(`should return the correct mini map sections`, () => {
    const miniMapPage: MiniMapPage = [0, 9];
    const timepointsDisplayCount = 5;
    const miniMapSections = getMiniMapSections(miniMapPage, timepointsDisplayCount);
    expect(miniMapSections).toEqual([
      [5, 9],
      [0, 4],
    ]);
  });

  it(`should return the correct mini map sections`, () => {
    const miniMapPage: MiniMapPage = [0, 32];
    const timepointsDisplayCount = 10;
    const miniMapSections = getMiniMapSections(miniMapPage, timepointsDisplayCount);

    expect(miniMapSections).toEqual([
      [23, 32],
      [13, 22],
      [3, 12],
      [0, 2],
    ]);
  });
});

describe(`findNearest`, () => {
  describe(`increase in pages (decreased width)`, () => {
    it(`should return the new page index with the most overlapping indices`, () => {
      const newPages: MiniMapPages = [
        [0, 0],
        [1, 3],
        [4, 6],
        [7, 9],
      ];
      const currentSectionRange: MiniMapSection = [4, 7];
      const nearestPage = findNearest(newPages, currentSectionRange);

      // favour further all things equal
      expect(nearestPage).toEqual(2);
    });

    it(`should favour the newest indices when all pages have the same number of overlapping indices`, () => {
      const newPages: MiniMapPages = [
        [0, 9],
        [10, 19],
        [20, 29],
      ];
      const currentSectionRange: MiniMapSection = [0, 29];
      const nearestPage = findNearest(newPages, currentSectionRange);

      // favour newest all things equal
      expect(nearestPage).toEqual(2);
    });
  });

  describe(`decrease in pages (increased width)`, () => {
    it(`should return the correct nearest page`, () => {
      const newPages: MiniMapPages = [[0, 29]];
      const currentSectionRange: MiniMapSection = [11, 13];
      const nearestPage = findNearest(newPages, currentSectionRange);

      expect(nearestPage).toEqual(0);
    });
  });
});

const PROBES = db.probe.buildList(3);

describe(`getPendingProbes`, () => {
  it(`should return the correct pending probes -- all selected pending`, () => {
    const entryProbeNames: string[] = [];
    const selectedProbeNames = PROBES.map((p) => p.name);
    const pendingProbes = getPendingProbes({ entryProbeNames, selectedProbeNames });

    expect(pendingProbes).toEqual(PROBES.map((p) => p.name));
  });

  it(`should return the correct pending probes -- one entry pending`, () => {
    const entryProbeNames: string[] = [PROBES[0].name, PROBES[1].name];
    const selectedProbeNames = PROBES.map((p) => p.name);
    const pendingProbes = getPendingProbes({ entryProbeNames, selectedProbeNames });
    expect(pendingProbes).toEqual([PROBES[2].name]);
  });

  it(`should return the correct pending probes -- no pending`, () => {
    const entryProbeNames: string[] = PROBES.map((p) => p.name);
    const selectedProbeNames = PROBES.map((p) => p.name);
    const pendingProbes = getPendingProbes({ entryProbeNames, selectedProbeNames });
    expect(pendingProbes).toEqual([]);
  });
});

describe(`buildlistLogsMap`, () => {
  it(`should build the correct logs map`, () => {
    const Time = 40003;
    const frequency = 10000;
    const DASHBOARD_FROM = 30000;
    const DASHBOARD_TO = 100000;

    const config = { frequency, from: 0, to: DASHBOARD_TO };

    const timepoints = buildTimepoints({
      checkConfigs: [config],
      from: DASHBOARD_FROM,
      to: DASHBOARD_TO,
    });

    const firstEntry = timepoints[0];

    const log = succeededLogFactory.build({
      Time,
      labels: {
        duration_seconds: (frequency / 1000).toString(),
      },
    });

    const listLogsMap = buildlistLogsMap({ logs: [log], timepoints });

    const expectedEntry: StatefulTimepoint = {
      adjustedTime: firstEntry.adjustedTime,
      config,
      probeResults: {
        [log.labels.probe]: [log],
      },
      status: 'success',
      timepointDuration: frequency,
      maxProbeDuration: Number(log.labels.duration_seconds) * 1000,
      index: 0,
    };

    expect(listLogsMap).toEqual({
      [firstEntry.adjustedTime]: expectedEntry,
    });
  });
});
