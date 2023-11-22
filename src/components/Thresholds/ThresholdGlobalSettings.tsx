import React, { useCallback, useContext, useEffect, useState } from 'react';
import { AppEvents, OrgRole } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { Button, HorizontalGroup, Modal } from '@grafana/ui';

import { FaroEvent, reportError, reportEvent } from 'faro';
import { hasRole } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import { SuccessRateContext, ThresholdValues } from 'contexts/SuccessRateContext';

import ThresholdFormSection from './ThresholdFormSection';

interface Props {
  onDismiss?: () => void;
  onSuccess?: () => void;
  onError?: () => void;
  // isOpen: boolean;
}

const thresholdPercentDefaults: ThresholdValues = {
  upperLimit: 99,
  lowerLimit: 75,
};

const thresholdMsDefaults: ThresholdValues = {
  upperLimit: 1000,
  lowerLimit: 200,
};

const appEvents = getAppEvents();

const ThresholdGlobalSettings = ({ onDismiss, onSuccess, onError }: Props) => {
  const { instance } = useContext(InstanceContext);
  const { thresholds, updateThresholds } = useContext(SuccessRateContext);

  const [showThresholdModal, setShowThresholdModal] = useState(false);
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
      reportEvent(FaroEvent.SAVE_THRESHOLDS);
      // Send new thresholds, then update context values
      await instance.api?.updateTenantSettings(postBody);
      await updateThresholds();
      appEvents.publish({ type: AppEvents.alertSuccess.name, payload: ['Thresholds updated'] });
      // Show success
      if (onDismiss) {
        onDismiss();
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (e: any) {
      // Show error
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [`Error updating thresholds. make sure your values don't overlap`],
      });
      if (onError) {
        onError();
      }
      reportError(e, FaroEvent.SAVE_THRESHOLDS);
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
    <>
      {hasRole(OrgRole.Editor) && (
        <>
          <Button
            variant="secondary"
            fill="outline"
            onClick={() => setShowThresholdModal((v) => !v)}
            // styles={css({ marginRight: theme.spacing(2) })}
          >
            Set Thresholds
          </Button>
        </>
      )}
      <Modal
        title="Threshold Settings"
        isOpen={showThresholdModal}
        onDismiss={() => {
          if (onDismiss) {
            onDismiss();
          }
          setShowThresholdModal(false);
        }}
      >
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
      </Modal>
    </>
  );
};

export default ThresholdGlobalSettings;
