import React, { useCallback, useEffect, useState } from 'react';
import ProbesByRegion from './ProbesByRegion';

import { Button, HorizontalGroup, Modal, LoadingPlaceholder, useStyles } from '@grafana/ui';
import { FilteredCheck, GrafanaInstances, Probe } from 'types';
import { GrafanaTheme } from '@grafana/data';
import { css } from '@emotion/css';
import { intersection } from 'lodash';

interface ProbeById {
  [key: number]: Probe;
}

interface Props {
  onDismiss: () => void;
  onSuccess: () => void;
  onError: (err: string) => void;
  selectedChecks: () => FilteredCheck[];
  instance: GrafanaInstances;
  action: 'add' | 'remove' | null;
  isOpen: boolean;
}

export const style = (theme: GrafanaTheme) => ({
  buttonGroup: css`
    margin: ${theme.spacing.md};
    margin-left: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    width: 90%;
  `,
  verticalSpace: css`
    margin-top: ${theme.spacing.sm};
    margin-bottom: ${theme.spacing.sm};
  `,
  bottomSpace: css`
    margin-bottom: ${theme.spacing.md};
  `,
  probesWrapper: css`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  `,
  halfWidth: css`
    width: 50%;
  `,
});

const BulkEditModal = ({ onDismiss, onSuccess, onError, isOpen, selectedChecks, action, instance }: Props) => {
  const [probes, setProbes] = useState<Probe[]>();
  const [probesById, setProbesById] = useState<ProbeById | undefined>(undefined);
  const [selectedProbes, setSelectedProbes] = useState<Probe[]>([]);
  const [probesToRemove, setProbesToRemove] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const checks = selectedChecks();

  const styles = useStyles(style);

  const submitProbeUpdates = useCallback(async () => {
    let newChecks: FilteredCheck[] = [];
    // Short circuit remove action if all checks only have one probe
    const checksHaveOneProbe = checks.every((check) => check.probes.length === 1);
    if (action === 'remove' && checksHaveOneProbe) {
      onDismiss();
      onError('Operation canceled - all checks only have one probe');
      return;
    }
    // Add or remove based on action
    if (action === 'add') {
      newChecks = checks.map((check) => {
        // Using a Set to avoid duplicates
        const newProbes = new Set([...check.probes, ...selectedProbes.map((p) => p.id!)]);
        return { ...check, probes: [...newProbes] };
      });
    } else if (action === 'remove') {
      // Filter out checks with only one probe
      const checksWithMultipleProbes = checks.filter((check) => check.probes.length > 1);
      // Update probes for each check and the remove any checks that would end up with zero probes
      newChecks = checksWithMultipleProbes
        .map((check) => {
          const newProbes = check.probes.filter((p) => !probesToRemove.includes(p));
          return { ...check, probes: newProbes };
        })
        .filter((check) => check.probes.length > 0);
    }
    try {
      setLoading(true);
      await instance.api?.bulkUpdateChecks(newChecks);
      setLoading(false);
      onDismiss();
      clearSelections();
      onSuccess();
    } catch (error: any) {
      setLoading(false);
      onDismiss();
      clearSelections();
      onError(error.data.err);
    }
  }, [selectedProbes, checks, instance, action, probesToRemove, onDismiss, onError, onSuccess]);

  const addOrRemoveProbe = useCallback(
    (probe) => {
      if (!selectedProbes.includes(probe)) {
        setSelectedProbes((sp) => [...sp, probe]);
      } else {
        const newSelectedProbes = selectedProbes.filter((p) => p !== probe);
        setSelectedProbes(newSelectedProbes);
      }
    },
    [selectedProbes]
  );

  const addOrRemoveCommonProbe = useCallback(
    (probe) => {
      if (!probesToRemove.includes(probe)) {
        setProbesToRemove((ptr) => [...ptr, probe]);
      } else {
        const newProbesToRemove = probesToRemove.filter((p) => p !== probe);
        setProbesToRemove(newProbesToRemove);
      }
    },
    [probesToRemove]
  );

  const clearSelections = () => {
    setSelectedProbes([]);
    setProbesToRemove([]);
  };

  const getProbes = useCallback(async () => {
    const p = await instance.api?.listProbes();
    if (p !== undefined) {
      const byId = p.reduce((acc, probe) => {
        return {
          ...acc,
          [Number(probe.id)]: probe,
        };
      }, {});
      setProbes(p.sort((a: Probe, b: Probe) => (a.name < b.name ? -1 : 1)));
      setProbesById(byId);
    } else {
      onError('Failed to get probes');
      onDismiss();
    }
  }, [instance, onDismiss, onError]);

  useEffect(() => {
    getProbes();
  }, [getProbes]);

  const commonProbes: number[] = intersection(...checks.map((check) => check.probes));

  return (
    <Modal
      title={
        action && action === 'add'
          ? `Add probes to ${checks.length} selected checks`
          : `Remove probes included in all ${checks.length} selected checks:`
      }
      isOpen={isOpen}
      onDismiss={() => {
        clearSelections();
        onDismiss();
      }}
    >
      {action && action === 'add' ? (
        <div>
          <div className={styles.verticalSpace}>
            <i>
              Disabled probes are already included in all selected checks. Any checks in which the configuration would
              not change will be unaffected on submission.
            </i>
          </div>
          <div>
            {probes && (
              <ProbesByRegion
                probes={probes}
                selectedProbes={selectedProbes}
                commonProbes={commonProbes}
                addOrRemoveProbe={addOrRemoveProbe}
              />
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className={styles.verticalSpace}>
            <i>
              Select probes to remove from all selected checks. Any checks using only a single probe or any that would
              result in using zero probes will be excluded from the operation.
            </i>
          </div>
          <div className={styles.buttonGroup}>
            {probesById && commonProbes.length ? (
              commonProbes.map((p) => {
                return (
                  <Button
                    key={p}
                    variant={probesToRemove.includes(p) ? 'destructive' : 'secondary'}
                    fill="outline"
                    size="sm"
                    onClick={() => addOrRemoveCommonProbe(p)}
                  >
                    {probesToRemove.includes(p) ? <del>{probesById[p].name}</del> : probesById[p].name}
                  </Button>
                );
              })
            ) : (
              <div>None</div>
            )}
          </div>
        </div>
      )}

      <div className={styles.verticalSpace}>
        {loading ? (
          <LoadingPlaceholder text="Submitting..." />
        ) : (
          <HorizontalGroup>
            <Button
              onClick={submitProbeUpdates}
              disabled={checks.length === 0 || (selectedProbes.length === 0 && probesToRemove.length === 0)}
            >
              Submit
            </Button>
            <Button variant="secondary" onClick={() => clearSelections()}>
              Clear
            </Button>
          </HorizontalGroup>
        )}
      </div>
    </Modal>
  );
};

export default BulkEditModal;
