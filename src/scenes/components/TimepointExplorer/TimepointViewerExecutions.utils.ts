import { StatelessTimepoint, UnixTimestamp } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TabToRender } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions.types';

export function filterTabsToRender(
  latestConfigDate: UnixTimestamp,
  tabsToRender: TabToRender[],
  timepoint: StatelessTimepoint | null
) {
  const isCurrentConfig = latestConfigDate === timepoint?.config.from;

  return tabsToRender.filter((tab) => {
    if (isCurrentConfig) {
      return true;
    }

    return tab.status !== 'missing';
  });
}
