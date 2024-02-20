import React, { useState } from 'react';
import { Button, HorizontalGroup, Modal } from '@grafana/ui';

import { ThresholdSettings, ThresholdValues } from 'types';
import { useThresholds, useUpdateThresholds } from 'data/useThresholds';

import ThresholdFormSection from './ThresholdFormSection';

interface Props {
  onDismiss: () => void;
  isOpen: boolean;
}

const thresholdPercentDefaults: ThresholdValues = {
  upperLimit: 99,
  lowerLimit: 75,
};

const thresholdMsDefaults: ThresholdValues = {
  upperLimit: 1000,
  lowerLimit: 200,
};

const ThresholdGlobalSettings = ({ onDismiss, isOpen }: Props) => {
  const { data } = useThresholds();

  if (!data) {
    return null;
  }

  return (
    <Modal title="Threshold Settings" isOpen={isOpen} onDismiss={onDismiss}>
      <ThresholdGlobalSettingsContent onSuccess={onDismiss} thresholds={data.thresholds} />
    </Modal>
  );
};

type ThresholdGlobalSettingsConentProps = {
  onSuccess: () => void;
  thresholds: ThresholdSettings;
};

const ThresholdGlobalSettingsContent = ({ onSuccess, thresholds }: ThresholdGlobalSettingsConentProps) => {
  const { mutate: onUpdate } = useUpdateThresholds({ onSuccess });

  const [uptimeThresholds, setUptimeThresholds] = useState<ThresholdValues>(thresholds?.uptime);
  const [reachabilityThresholds, setReachabilityThresholds] = useState<ThresholdValues>(thresholds.reachability);
  const [latencyThresholds, setLatencyThresholds] = useState<ThresholdValues>(thresholds.latency);

  const handleSetDefaults = () => {
    setUptimeThresholds(thresholdPercentDefaults);
    setReachabilityThresholds(thresholdPercentDefaults);
    setLatencyThresholds(thresholdMsDefaults);
  };

  const handleSaveThresholds = () => {
    onUpdate({
      uptime: uptimeThresholds,
      reachability: reachabilityThresholds,
      latency: latencyThresholds,
    });
  };

  return (
    <>
      <HorizontalGroup spacing="sm" height={35}>
        <Button data-testid="threshold-save" onClick={handleSaveThresholds}>
          Save changes
        </Button>
        <Button data-testid="threshold-defaults" variant="secondary" onClick={handleSetDefaults}>
          Reset all to defaults
        </Button>
      </HorizontalGroup>
      <p style={{ marginTop: '20px', marginBottom: '20px', fontStyle: 'italic', fontSize: '.9rem' }}>
        Note: these settings apply only to the check list view.
      </p>
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <ThresholdFormSection
          thresholds={uptimeThresholds}
          setThresholds={setUptimeThresholds}
          label="Uptime"
          unit="%"
          description="How often any single probe is able to reach an endpoint."
        />
        <ThresholdFormSection
          thresholds={reachabilityThresholds}
          setThresholds={setReachabilityThresholds}
          label="Reachability"
          unit="%"
          description="The aggregate success rate of all probes."
        />
        <ThresholdFormSection
          thresholds={latencyThresholds}
          setThresholds={setLatencyThresholds}
          label="Request latency"
          unit="ms"
          description="The amount of time it takes to reach an endpoint."
        />
      </div>
    </>
  );
};

export default ThresholdGlobalSettings;
