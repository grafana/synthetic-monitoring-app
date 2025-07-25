import { MiniMapPage } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getMiniMapPages, getMiniMapSections } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

describe(`getMiniMapPages`, () => {
  it(`should not get into an infinite loop`, () => {});

  it(`should return the correct mini map pages`, () => {
    const timepointsDisplayCount = 10;
    const miniMapPages = getMiniMapPages(63, timepointsDisplayCount);

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
