import { CheckConfig, StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TabToRender } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions.types';

export function filterTabsToRender(
  tabsToRender: TabToRender[],
  checkConfigs: CheckConfig[],
  timepoint: StatelessTimepoint | null
) {
  const latestConfig = checkConfigs[checkConfigs.length - 1];
  const isCurrentConfig = latestConfig.from === timepoint?.config.from;

  return tabsToRender.filter((tab) => {
    if (isCurrentConfig) {
      return true;
    }

    return tab.status !== 'missing';
  });
}
