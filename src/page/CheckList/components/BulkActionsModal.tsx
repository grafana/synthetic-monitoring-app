import React, { useCallback, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Modal, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { intersection, isEqual } from 'lodash';

import { Check, Probe } from 'types';
import { getCheckType } from 'utils';
import { useBulkUpdateChecks } from 'data/useChecks';
import { useProbesWithMetadata } from 'data/useProbes';
import { getAvailableProbes } from 'components/CheckEditor/ProbeOptions';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';
import { ProbesByRegion } from 'page/CheckList/components/ProbesByRegion';

const ACTION_TYPE_MAP = {
  add: {
    getTitle: (checks: Check[]) => `Add probes to ${checks.length} selected checks`,
    description:
      'Deprecated probes, incompatible probes, and probes already included in all selected checks cannot be added. Any checks in which the configuration would not change will be unaffected on submission.',
  },
  remove: {
    getTitle: (checks: Check[]) => `Remove probes from ${checks.length} selected checks:`,
    description:
      'Select probes to remove from all selected checks. Checks that would have no remaining probes will be skipped. Add a replacement location first.',
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
  const { data: probes = [] } = useProbesWithMetadata();
  const { mutate: bulkUpdateChecks, isPending, isError } = useBulkUpdateChecks({ onSuccess: onDismiss });
  const [probeIds, setProbeIds] = useState<number[]>([]);
  const commonProbes = intersection(...checks.map((check) => check.probes));
  const styles = useStyles2(getStyles);
  const { getTitle, description } = ACTION_TYPE_MAP[action];
  const isAdding = action === 'add';

  const selectableProbes = probes.map((probe) => {
    const incompatible = checks.some((check) => !getAvailableProbes([probe], getCheckType(check.settings)).length);
    const disabled = isAdding && (probe.deprecated || incompatible || commonProbes.includes(probe.id!));
    const tooltip =
      isAdding && probe.deprecated
        ? 'Deprecated probes cannot be added to checks'
        : isAdding && incompatible
          ? 'Probe does not support all selected check types'
          : disabled
            ? 'Probe is already included in all selected checks'
            : undefined;

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

  // Re-evaluate eligibility after polling: a selected probe may have become deprecated.
  const eligibleProbeIds = probeIds.filter((id) =>
    selectableProbes.some((probe) => probe.id === id && !probe.disabled)
  );
  const candidateChecks = checks.map((check) => ({
    ...check,
    probes: getUpdatedProbes(check, action, eligibleProbeIds),
  }));
  const skippedCount = candidateChecks.filter((check) => check.probes.length === 0).length;
  const updatedChecks = candidateChecks.filter(
    (check, index) => check.probes.length > 0 && !isEqual(check.probes, checks[index].probes)
  );

  const handleSubmit = () => {
    if (updatedChecks.length > 0) {
      bulkUpdateChecks(updatedChecks);
    }
  };

  return (
    <Modal
      title={getTitle(checks)}
      isOpen={isOpen}
      onDismiss={() => {
        onDismiss();
      }}
    >
      {isError && (
        <Alert title="Bulk update failed" severity="error">
          The update operation failed. Try selecting fewer checks and retrying.
        </Alert>
      )}

      {skippedCount > 0 && (
        <Alert
          severity="warning"
          title={`${skippedCount} ${skippedCount === 1 ? 'check will' : 'checks will'} be skipped`}
        >
          These checks would have no remaining probes. Add a replacement location before removing this probe.
        </Alert>
      )}
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
            disabled={!updatedChecks.length || isPending}
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
    return [...new Set([...check.probes, ...probeIds])];
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
