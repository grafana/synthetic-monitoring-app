import React, { useCallback, useEffect, useState } from 'react';

import { Button, HorizontalGroup, Modal, useStyles, Tooltip } from '@grafana/ui';
import { FilteredCheck, GrafanaInstances } from 'types';
import { fetchProbes } from 'components/CheckList/actions';
import { GrafanaTheme } from '@grafana/data';
import { css } from '@emotion/css';
import { intersection } from 'lodash';
import { PROBE_REGION_MAPPING } from 'components/constants';

interface Probe {
  label: string;
  value: number | undefined;
}

interface ProbeById {
  [key: number]: Probe;
}

interface Props {
  onDismiss: () => void;
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
  const isCommonProbe = probe.value && commonProbes.includes(probe.value);

  return (
    <Button
      variant={selectedProbes?.includes(probe) ? 'primary' : 'secondary'}
      disabled={isCommonProbe ? true : false}
      size="sm"
      onClick={() => addOrRemoveProbe(probe)}
    >
      {probe.label}
    </Button>
  );
};

interface RegionMapping {
  [key: string]: Probe[];
}

const ProbesByRegion = ({ probes, selectedProbes, commonProbes, addOrRemoveProbe }: ProbesByRegionProps) => {
  const styles = useStyles(style);

  const {
    EU: probesEU,
    Americas: probesAmerica,
    Asia: probesAsia,
    Africas: probesAfrica,
    OCE: probesOCE,
  } = probes.reduce<RegionMapping>((acc, probe) => {
    const currentRegion: string = PROBE_REGION_MAPPING[probe.label];

    if (typeof acc[currentRegion] === 'undefined') {
      acc[currentRegion] = [];
    }
    acc[currentRegion].push(probe);

    return acc;
  }, {});

  return (
    <div className={styles.probesWrapper}>
      <div>
        <h5>Americas</h5>
        <div className={styles.buttonGroup}>
          {probesAmerica.map((p) => {
            return (
              <ProbeButton
                key={p.value}
                probe={p}
                selectedProbes={selectedProbes}
                commonProbes={commonProbes}
                addOrRemoveProbe={addOrRemoveProbe}
              />
            );
          })}
        </div>
        <h5>EU</h5>
        <div className={styles.buttonGroup}>
          {probesEU.map((p) => {
            return (
              <ProbeButton
                key={p.value}
                probe={p}
                selectedProbes={selectedProbes}
                commonProbes={commonProbes}
                addOrRemoveProbe={addOrRemoveProbe}
              />
            );
          })}
        </div>
        <h5>Asia</h5>
        <div className={styles.buttonGroup}>
          {probesAsia.map((p) => {
            return (
              <ProbeButton
                key={p.value}
                probe={p}
                selectedProbes={selectedProbes}
                commonProbes={commonProbes}
                addOrRemoveProbe={addOrRemoveProbe}
              />
            );
          })}
        </div>
        <div>
          <h5>Africas</h5>
          <div className={styles.buttonGroup}>
            {probesAfrica.map((p) => {
              return (
                <ProbeButton
                  key={p.value}
                  probe={p}
                  selectedProbes={selectedProbes}
                  commonProbes={commonProbes}
                  addOrRemoveProbe={addOrRemoveProbe}
                />
              );
            })}
          </div>
        </div>
        <div>
          <h5>OCE</h5>
          <div className={styles.buttonGroup}>
            {probesOCE.map((p) => {
              return (
                <ProbeButton
                  key={p.value}
                  probe={p}
                  selectedProbes={selectedProbes}
                  commonProbes={commonProbes}
                  addOrRemoveProbe={addOrRemoveProbe}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const BulkEditModal = ({ onDismiss, isOpen, selectedChecks, action, instance }: Props) => {
  const [probes, setProbes] = useState<Probe[]>();
  const [probesById, setProbesById] = useState<ProbeById>({});
  const [selectedProbes, setSelectedProbes] = useState<Probe[]>([]);
  const [probesToRemove, setProbesToRemove] = useState<number[]>([]);
  const checks = selectedChecks();

  const styles = useStyles(style);

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
    const p = await fetchProbes(instance);
    console.log({ p });
    const byId = p.reduce((acc, probe) => {
      return {
        ...acc,
        [probe.value!]: probe,
      };
    });

    setProbes(p.sort((a: any, b: any) => (a.label < b.label ? -1 : 1)));
    setProbesById(byId);
  }, [instance]);

  useEffect(() => {
    getProbes();
  }, [getProbes]);

  const commonProbes: number[] = intersection(...checks.map((check) => check.probes));

  console.log({ action });
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
        <div className={styles.bottomSpace}>
          {commonProbes.length ? (
            commonProbes.map((p) => {
              return (
                <Tooltip key={p} content="Click to remove from selected probes">
                  <Button
                    variant={probesToRemove.includes(p) ? 'destructive' : 'secondary'}
                    fill="outline"
                    size="sm"
                    onClick={() => addOrRemoveCommonProbe(p)}
                  >
                    {probesToRemove.includes(p) ? <del>{probesById[p].label}</del> : probesById[p].label}
                  </Button>
                </Tooltip>
              );
            })
          ) : (
            <div>None</div>
          )}
        </div>
      )}

      <div className={styles.verticalSpace}>
        <HorizontalGroup>
          <Button disabled={checks.length === 0 || (selectedProbes.length === 0 && probesToRemove.length === 0)}>
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
