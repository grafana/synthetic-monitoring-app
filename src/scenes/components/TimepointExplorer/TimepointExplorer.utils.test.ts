import { MiniMapPage } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  buildTimepoints,
  getMiniMapPages,
  getMiniMapSections,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

describe(`getMiniMapPages`, () => {
  it(`should return the correct mini map views`, () => {
    const from = 0;
    const to = 62000; // 60 entries
    const checkConfigs = [{ frequency: 1000, date: 0 }];
    const timepoints = buildTimepoints({ from, to, checkConfigs });
    const timepointsDisplayCount = 10;
    const miniMapPages = getMiniMapPages(timepoints, timepointsDisplayCount);

    expect(miniMapPages).toEqual([
      [2, 62],
      [0, 1],
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
