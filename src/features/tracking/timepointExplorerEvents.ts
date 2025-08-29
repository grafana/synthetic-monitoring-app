import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

import { LogsView } from 'scenes/components/LogsRenderer/LogsViewSelect';
import { TimepointStatus, ViewMode } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

const timepointExplorerEvents = createSMEventFactory('timepoint_explorer');

interface ViewToggle extends TrackingEventProps {
  /** The view type. */
  viewMode: ViewMode;
}

/** Tracks when the Timepoint Explorer view type is changed. */
export const trackViewToggle = timepointExplorerEvents<ViewToggle>('view_toggle');

interface MiniMapSectionClicked extends TrackingEventProps {
  /** The index of the section of the mini map that was clicked. */
  index: number;
  /** The UI component that was clicked. */
  component: 'left-arrow' | 'right-arrow' | 'section';
}

/** Tracks when a section of the Timepoint Explorer mini map is clicked. */
export const trackMiniMapSectionClicked = timepointExplorerEvents<MiniMapSectionClicked>('mini_map_section_clicked');

interface MiniMapPageChange extends TrackingEventProps {
  /** The index of the page that was clicked. */
  index: number;
}

/** Tracks when the Timepoint Explorer mini map page is changed. */
export const trackMiniMapPageClicked = timepointExplorerEvents<MiniMapPageChange>('mini_map_page_clicked');

export interface TimepointDetailsClick extends TrackingEventProps {
  /** The UI component that was clicked. */
  component: 'tooltip' | 'reachability-entry' | 'viewer-tab' | 'uptime-entry' | 'pending-entry';
  /** The status of the Timepoint List entry that was clicked. */
  status: TimepointStatus;
}

/** Tracks when a probe entry in the Timepoint Viewer is clicked. */
export const trackTimepointDetailsClicked = timepointExplorerEvents<TimepointDetailsClick>('timepoint_click');

interface TimepointVizLegendClicked extends TrackingEventProps {
  /** The viz options that were toggled. */
  vizOptions: string;
}

/** Tracks when a Timepoint Viz Legend is clicked. */
export const trackTimepointVizLegendToggled =
  timepointExplorerEvents<TimepointVizLegendClicked>('timepoint_viz_legend_toggled');

interface TimepointVizLegendColorClicked extends TrackingEventProps {
  /** The color of the viz option that was clicked. */
  color: string;
  /** The viz option that was clicked. */
  vizOption: TimepointStatus;
}

/** Tracks when a Timepoint Viz Legend color is clicked. */
export const trackTimepointVizLegendColorClicked = timepointExplorerEvents<TimepointVizLegendColorClicked>(
  'timepoint_viz_legend_color_clicked'
);

interface TimepointViewerActionClicked extends TrackingEventProps {
  /** The action that was clicked. */
  action: 'previous-timepoint' | 'next-timepoint' | 'view-explore-logs' | 'view-explore-metrics';
}

/** Tracks when a Timepoint Viewer action is clicked */
export const trackTimepointViewerActionClicked = timepointExplorerEvents<TimepointViewerActionClicked>(
  'timepoint_viewer_action_clicked'
);

interface TimepointViewerLogsViewToggled extends TrackingEventProps {
  /** The action that was clicked. */
  action: LogsView;
}

/** Tracks when the Timepoint Viewer logs view is toggled */
export const trackTimepointViewerLogsViewToggled = timepointExplorerEvents<TimepointViewerLogsViewToggled>(
  'timepoint_viewer_logs_view_toggled'
);
