import React, { useState, useCallback, useContext, useEffect } from 'react';

import { Modal, Button, HorizontalGroup } from '@grafana/ui';
import { SuccessRateContext, ThresholdValues } from 'contexts/SuccessRateContext';
import { InstanceContext } from 'contexts/InstanceContext';
import ThresholdFormSection from './ThresholdFormSection';

interface Props {
  onDismiss: () => void;
  onSuccess: () => void;
  onError: () => void;
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

const ThresholdGlobalSettings = ({ onDismiss, onSuccess, onError, isOpen }: Props) => {
  const { instance } = useContext(InstanceContext);
  const { thresholds, updateThresholds } = useContext(SuccessRateContext);

  const [uptimeThresholds, setUptimeThresholds] = useState<ThresholdValues>(thresholds.uptime);
  const [reachabilityThresholds, setReachabilityThresholds] = useState<ThresholdValues>(thresholds.reachability);
  const [latencyThresholds, setLatencyThresholds] = useState<ThresholdValues>(thresholds.latency);

  const handleSetDefaults = () => {
    setUptimeThresholds(thresholdPercentDefaults);
    setReachabilityThresholds(thresholdPercentDefaults);
    setLatencyThresholds(thresholdMsDefaults);
  };

  const handleSaveThresholds = useCallback(async () => {
    const postBody = {
      thresholds: {
        uptime: {
          ...uptimeThresholds,
        },
        reachability: {
          ...reachabilityThresholds,
        },
        latency: {
          ...latencyThresholds,
        },
      },
    };
    try {
      // Send new thresholds, then update context values
      await instance.api?.updateTenantSettings(postBody);
      await updateThresholds();
      // Show success
      onDismiss();
      onSuccess();
    } catch (e) {
      // Show error
      onError();
      console.log({ e });
    }
  }, [
    uptimeThresholds,
    reachabilityThresholds,
    latencyThresholds,
    instance.api,
    updateThresholds,
    onDismiss,
    onError,
    onSuccess,
  ]);

  // Set thresholds in form when they are updated in context
  useEffect(() => {
    setUptimeThresholds(thresholds.uptime);
    setReachabilityThresholds(thresholds.reachability);
    setLatencyThresholds(thresholds.latency);
  }, [thresholds]);

  return (
    <Modal title="Threshold Settings" isOpen={isOpen} onDismiss={onDismiss}>
      <HorizontalGroup spacing="sm">
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
    </Modal>
  );
};

export default ThresholdGlobalSettings;
