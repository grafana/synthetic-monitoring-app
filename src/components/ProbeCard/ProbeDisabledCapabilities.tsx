import React, { useMemo } from 'react';
import { Text } from '@grafana/ui';

import { type ExtendedProbe } from 'types';

interface ProbeDisabledCapabilitiesProps {
  probe: ExtendedProbe;
}
export function ProbeDisabledCapabilities({ probe }: ProbeDisabledCapabilitiesProps) {
  const browserChecksDisabled = probe.capabilities.disableBrowserChecks;
  const scriptedChecksDisabled = probe.capabilities.disableScriptedChecks;
  const noun = browserChecksDisabled && scriptedChecksDisabled ? 'types' : 'type';

  const disabledChecks = useMemo(() => {
    const disabledChecks = [];
    if (scriptedChecksDisabled) {
      disabledChecks.push('Scripted');
    }

    if (browserChecksDisabled) {
      disabledChecks.push('Browser');
    }

    return disabledChecks.join(', ');
  }, [browserChecksDisabled, scriptedChecksDisabled]);

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
