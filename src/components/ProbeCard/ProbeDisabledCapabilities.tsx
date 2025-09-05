import React, { useMemo } from 'react';
import { Text } from '@grafana/ui';

import { type ExtendedProbe, FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';

interface ProbeDisabledCapabilitiesProps {
  probe: ExtendedProbe;
}
export function ProbeDisabledCapabilities({ probe }: ProbeDisabledCapabilitiesProps) {
  // as we only want to show that a feature is disabled if the user can use the feature to start with
  const browserFeature = useFeatureFlag(FeatureName.BrowserChecks);

  const browserChecksDisabled = probe.capabilities.disableBrowserChecks;
  const scriptedChecksDisabled = probe.capabilities.disableScriptedChecks;
  const noun = browserChecksDisabled && scriptedChecksDisabled ? 'types' : 'type';

  const disabledChecks = useMemo(() => {
    const disabledChecks = [];
    if (scriptedChecksDisabled) {
      disabledChecks.push('Scripted');
    }

    if (browserFeature.isEnabled && browserChecksDisabled) {
      disabledChecks.push('Browser');
    }

    return disabledChecks.join(', ');
  }, [browserChecksDisabled, browserFeature.isEnabled, scriptedChecksDisabled]);

  if (!disabledChecks) {
    return <div />;
  }

  return (
    <div>
      <span>Unsupported check {noun}:&nbsp;</span>
      <Text color="error">{disabledChecks}</Text>
    </div>
  );
}
