import { buildTimepoints, getMiniMapPages } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

describe(`getMiniMapPages`, () => {
  it(`should return the correct mini map views`, () => {
    const from = 0;
    const to = 61000; // 60 entries
    const checkConfigs = [{ frequency: 1000, date: 0 }];
    const timepoints = buildTimepoints({ from, to, checkConfigs });
    const timepointsDisplayCount = 10;
    const miniMapViews = getMiniMapPages(timepoints, timepointsDisplayCount);

    expect(miniMapViews).toEqual([
      [2, 61],
      [0, 1],
    ]);
  });
});
