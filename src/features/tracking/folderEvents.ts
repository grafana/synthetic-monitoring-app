import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const folderEvents = createSMEventFactory('folders');

interface FolderSelectedEvent extends TrackingEventProps {
  /** Whether the selected folder is the default SM folder. */
  isDefault: boolean;
}

/** Tracks when a folder is selected in the folder selector. */
export const trackFolderSelected = folderEvents<FolderSelectedEvent>('folder_selected');

/** Tracks when a new folder is created via the folder selector. */
export const trackFolderCreated = folderEvents('folder_created');
