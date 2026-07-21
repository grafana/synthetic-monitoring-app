import React, { PropsWithChildren } from 'react';
import { SceneContextProvider } from '@grafana/scenes-react';

import { useAppTime } from 'contexts/AppTimeProvider';

export function TimepointExplorerSceneBridge({ children }: PropsWithChildren) {
  const appTime = useAppTime();

  return (
    <SceneContextProvider
      key={`${appTime.raw.from}-${appTime.raw.to}`}
      timeRange={{ from: appTime.raw.from, to: appTime.raw.to }}
      withQueryController
    >
      {children}
    </SceneContextProvider>
  );
}
