import React, { useCallback, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Modal, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { intersection } from 'lodash';

import { Check, Probe } from 'types';
import { useBulkUpdateChecks } from 'data/useChecks';
import { useProbes } from 'data/useProbes';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';
import { ProbesByRegion } from 'page/CheckList/components/BulkActions/ProbesByRegion';

const actionTypeMap = {
  add: {
    getTitle: (checks: Check[]) => `Add probes to ${checks.length} selected checks`,
    description:
      'Disabled probes are already included in all selected checks. Any checks in which the configuration would not change will be unaffected on submission.',
  },
  remove: {
    getTitle: (checks: Check[]) => `Remove probes included in all ${checks.length} selected checks:`,
    description:
      'Select probes to remove from all selected checks. Any checks using only a single probe or any that would result in using zero probes will be excluded from the operation.',
  },
};

interface BulkActionModalProps {
  onDismiss: () => void;
  checks: Check[];
  action: 'add' | 'remove';
  isOpen: boolean;
}

export const BulkActionsModal = (props: BulkActionModalProps) => {
  if (!props.action) {
    return null;
  }

  return (
    <QueryErrorBoundary>
      <BulkActionsModalContent {...props} />
    </QueryErrorBoundary>
  );
};

const BulkActionsModalContent = ({ onDismiss, isOpen, checks, action }: BulkActionModalProps) => {
  const { data: probes = [] } = useProbes();
  const { mutate: bulkUpdateChecks, isPending } = useBulkUpdateChecks({ onSuccess: onDismiss });
  const [probeIds, setProbeIds] = useState<number[]>([]);
  const commonProbes = intersection(...checks.map((check) => check.probes));
  const styles = useStyles2(getStyles);
  const { getTitle, description } = actionTypeMap[action];
  const isAdding = action === 'add';

  const selectableProbes = probes.map((probe) => {
    const disabled = isAdding && commonProbes.includes(probe.id!);
    const tooltip = disabled ? 'Probe is already included in all selected checks' : undefined;

    return {
      name: probe.name,
      id: probe.id,
      region: probe.region,
      selected: probeIds.includes(probe.id!),
      disabled,
      tooltip,
    };
  });

  const handleChange = useCallback(
    (id: Probe['id']) => {
      if (probeIds.includes(id!)) {
        setProbeIds(probeIds.filter((i) => i !== id));
      } else {
        setProbeIds([...probeIds, id!]);
      }
    },
    [probeIds]
  );

  const handleSubmit = () => {
    const updatedChecks = checks.map((check) => {
      const probes = getUpdatedProbes(check, action, probeIds);

      return {
        ...check,
        probes,
      };
    });

    bulkUpdateChecks(updatedChecks);
  };

  return (
    <Modal
      title={getTitle(checks)}
      isOpen={isOpen}
      onDismiss={() => {
        onDismiss();
      }}
    >
      <div>
        <div className={styles.verticalSpace}>
          <i>{description}</i>
        </div>
        <div>
          {probes && <ProbesByRegion probes={selectableProbes} onChange={handleChange} isRemoving={!isAdding} />}
        </div>
      </div>

      <div className={styles.verticalSpace}>
        <Stack>
          <Button
            onClick={handleSubmit}
            disabled={!probeIds.length || isPending}
            icon={isPending ? 'fa fa-spinner' : undefined}
            variant={isAdding ? 'primary' : 'destructive'}
          >
            {isAdding ? 'Add probes' : 'Remove probes'}
          </Button>
          <Button disabled={!probeIds.length || isPending} variant="secondary" onClick={() => setProbeIds([])}>
            Clear selection
          </Button>
        </Stack>
      </div>
    </Modal>
  );
};

function getUpdatedProbes(check: Check, action: 'add' | 'remove', probeIds: number[]) {
  if (action === 'add') {
    return [...check.probes, ...probeIds];
  }

  return check.probes.filter((id) => !probeIds.includes(id));
}

const getStyles = (theme: GrafanaTheme2) => ({
  buttonGroup: css`
    margin: ${theme.spacing(2)};
    margin-left: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    width: 90%;
  `,
  verticalSpace: css`
    margin-top: ${theme.spacing(1)};
    margin-bottom: ${theme.spacing(1)};
  `,
});
