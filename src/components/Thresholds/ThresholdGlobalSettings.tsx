import React, { useState, useCallback, useContext, useEffect } from 'react';

import { Modal, Button, HorizontalGroup } from '@grafana/ui';
import { SuccessRateContext } from 'contexts/SuccessRateContext';
import { InstanceContext } from 'contexts/InstanceContext';
import ThresholdFormSection from './ThresholdFormSection';

interface Props {
  onDismiss: () => void;
  onSuccess: () => void;
  onError: () => void;
  isOpen: boolean;
}

export interface Threshold {
  upper_limit: number;
  lower_limit: number;
}

const thresholdPercentDefaults: Threshold = {
  upper_limit: 99,
  lower_limit: 75,
};

const thresholdMsDefaults: Threshold = {
  upper_limit: 1000,
  lower_limit: 1000,
};

// get current thresholds
// set thresholds in context on save

const ThresholdGlobalSettings = ({ onDismiss, onSuccess, onError, isOpen }: Props) => {
  const { instance } = useContext(InstanceContext);
  const { thresholds, updateThresholds } = useContext(SuccessRateContext);

  const [uptimeThresholds, setUptimeThresholds] = useState<Threshold>(thresholds.uptime);
  const [reachabilityThresholds, setReachabilityThresholds] = useState<Threshold>(thresholds.reachability);
  const [latencyThresholds, setLatencyThresholds] = useState<Threshold>(thresholds.latency);

  console.log({ thresholds });

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
    <Modal title="Global Threshold Settings" isOpen={isOpen} onDismiss={onDismiss}>
      <HorizontalGroup spacing="sm">
        <Button onClick={handleSaveThresholds}>Save changes</Button>
        <Button variant="secondary" onClick={handleSetDefaults}>
          Reset all to defaults
        </Button>
      </HorizontalGroup>
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <ThresholdFormSection
          thresholds={uptimeThresholds}
          setThresholds={setUptimeThresholds}
          label="Uptime"
          unit="%"
          description="How often all probes are able to reach an endpoint."
        />
        <ThresholdFormSection
          thresholds={reachabilityThresholds}
          setThresholds={setReachabilityThresholds}
          label="Reachability"
          unit="%"
          description="How often a single probe is able to reach an endpoint."
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
