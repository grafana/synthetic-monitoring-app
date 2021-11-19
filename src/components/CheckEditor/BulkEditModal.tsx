import React, { useCallback, useEffect, useState } from 'react';

import { Button, HorizontalGroup, Modal, useStyles } from '@grafana/ui';
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
  onError: (err: any) => void;
  selectedChecks: () => FilteredCheck[];
  instance: GrafanaInstances;
  action: 'add' | 'remove' | null;
  isOpen: boolean;
}

interface ProbesByRegionProps {
  probes: Probe[];
  selectedProbes: Probe[];
  commonProbes: number[];
  addOrRemoveProbe: (probe: Probe) => void;
}

interface ProbeButtonProps {
  probe: Probe;
  selectedProbes: Probe[];
  commonProbes: number[];
  addOrRemoveProbe: (probe: Probe) => void;
}

const style = (theme: GrafanaTheme) => ({
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

const ProbeButton = ({ probe, selectedProbes, commonProbes, addOrRemoveProbe }: ProbeButtonProps) => {
  const isCommonProbe = probe.id && commonProbes.includes(probe.id);

  return (
    <Button
      variant={selectedProbes?.includes(probe) ? 'primary' : 'secondary'}
      disabled={isCommonProbe ? true : false}
      size="sm"
      onClick={() => addOrRemoveProbe(probe)}
    >
      {probe.name}
    </Button>
  );
};

interface RegionMapping {
  [key: string]: Probe[];
}

const ProbesByRegion = ({ probes, selectedProbes, commonProbes, addOrRemoveProbe }: ProbesByRegionProps) => {
  const styles = useStyles(style);

  // Group probes by region
  const probesByRegion = probes.reduce<RegionMapping>((acc, probe) => {
    const currentRegion: string = probe.region;

    if (typeof acc[currentRegion] === 'undefined') {
      acc[currentRegion] = [];
    }
    acc[currentRegion].push(probe);

    return acc;
  }, {});

  return (
    <div className={styles.probesWrapper}>
      <div>
        {Object.keys(probesByRegion).map((region: string) => {
          return (
            <>
              <h5>{region}</h5>
              <div className={styles.buttonGroup}>
                {probesByRegion[region].map((p) => {
                  return (
                    <ProbeButton
                      key={p.name}
                      probe={p}
                      selectedProbes={selectedProbes}
                      commonProbes={commonProbes}
                      addOrRemoveProbe={addOrRemoveProbe}
                    />
                  );
                })}
              </div>
            </>
          );
        })}
      </div>
    </div>
  );
};

const BulkEditModal = ({ onDismiss, onSuccess, onError, isOpen, selectedChecks, action, instance }: Props) => {
  const [probes, setProbes] = useState<Probe[]>();
  const [probesById, setProbesById] = useState<ProbeById>({});
  const [selectedProbes, setSelectedProbes] = useState<Probe[]>([]);
  const [probesToRemove, setProbesToRemove] = useState<number[]>([]);
  const checks = selectedChecks();

  const styles = useStyles(style);

  const submitProbeUpdates = useCallback(async () => {
    let newChecks: FilteredCheck[] = [];
    // Add or remove based on action
    if (action === 'add') {
      newChecks = checks.map((check) => {
        // Using a Set to avoid duplicates
        const newProbes = new Set([...check.probes, ...selectedProbes.map((p) => p.id!)]);
        return { ...check, probes: [...newProbes] };
      });
    } else if (action === 'remove') {
      newChecks = checks.map((check) => {
        const newProbes = check.probes.filter((p) => !probesToRemove.includes(p));
        return { ...check, probes: newProbes };
      });
    }
    try {
      await instance.api?.bulkUpdateChecks(newChecks);
      onDismiss();
      onSuccess();
    } catch (error) {
      onDismiss();
      onError(error);
    }
    console.log({ newChecks });
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
    const p = await instance.api!.listProbes();
    console.log({ p });
    const byId = p.reduce((acc, probe) => {
      return {
        ...acc,
        [probe.id as number]: probe,
      };
    }, {});

    setProbes(p.sort((a: any, b: any) => (a.name < b.name ? -1 : 1)));
    setProbesById(byId);
  }, [instance]);

  useEffect(() => {
    getProbes();
  }, [getProbes]);

  // fix implicit state
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
        onDismiss();
        clearSelections();
      }}
    >
      {action && action === 'add' ? (
        <div>
          <div className={styles.verticalSpace}>
            <i>
              Disabled probes are already included in all selected checks. On submission, any checks that already use
              probes selected here will be unaffected.
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
            <i>Select probes to remove from all selected checks.</i>
          </div>
          <div className={styles.buttonGroup}>
            {commonProbes.length ? (
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
      </div>
    </Modal>
  );
};

export default BulkEditModal;
