import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { OrgRole } from '@grafana/data';
import { Button, ConfirmModal } from '@grafana/ui';

import { type Probe, type ProbePageParams, ROUTES } from 'types';
import { hasRole } from 'utils';
import { type UpdateProbeResult, useDeleteProbe, useUpdateProbe } from 'data/useProbes';
import { useNavigation } from 'hooks/useNavigation';
import { PluginPage } from 'components/PluginPage';
import { ProbeEditor } from 'components/ProbeEditor';
import { ProbeStatus } from 'components/ProbeStatus';
import { ProbeTokenModal } from 'components/ProbeTokenModal';

import { getErrorInfo, getTitle } from './EditProbe.utils';

type EditProbeProps = {
  probes: Probe[];
  refetchProbes: () => void;
};

export const EditProbe = ({ probes, refetchProbes }: EditProbeProps) => {
  const { id } = useParams<ProbePageParams>();
  const probe = probes.find((probe) => probe.id?.toString() === id);
  const navigate = useNavigation();

  useEffect(() => {
    if (!probe && probes.length) {
      navigate(ROUTES.Probes);
    }
  }, [navigate, probe, probes]);

  return (
    <PluginPage pageNav={{ text: getTitle(probe) }}>
      {probe && <EditProbeContent probe={probe} refetchProbes={refetchProbes} />}
    </PluginPage>
  );
};

const EditProbeContent = ({ probe, refetchProbes }: { probe: Probe; refetchProbes: () => void }) => {
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [probeToken, setProbeToken] = useState(``);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigation();
  const { onUpdate, error: updateError } = useUpdateProbe();
  const { onDelete, error: deleteError } = useDeleteProbe();

  const onReset = (token: string) => {
    setShowTokenModal(true);
    setProbeToken(token);
  };

  const onUpdateSuccess = (res: UpdateProbeResult) => {
    refetchProbes();
    navigate(ROUTES.Probes);
  };

  const handleSubmit = (formValues: Probe) => {
    return onUpdate(
      {
        ...probe,
        ...formValues,
      },
      onUpdateSuccess
    );
  };

  const handleDelete = () => {
    return onDelete(probe, () => {
      setShowDeleteModal(false);
      refetchProbes();
      navigate(ROUTES.Probes);
    });
  };

  useEffect(() => {
    if (deleteError) {
      setShowDeleteModal(false);
    }
  }, [deleteError]);

  const canEdit = !probe.public && hasRole(OrgRole.Editor);
  const actions = canEdit ? (
    <Button type="button" variant="destructive" onClick={() => setShowDeleteModal(true)}>
      Delete Probe
    </Button>
  ) : null;

  return (
    <>
      <ProbeEditor
        actions={actions}
        errorInfo={getErrorInfo(updateError, deleteError)}
        onSubmit={handleSubmit}
        probe={probe}
        submitText="Update probe"
        supportingContent={<ProbeStatus canEdit={canEdit} probe={probe} onReset={onReset} />}
      />
      <ProbeTokenModal
        actionText="Close"
        isOpen={showTokenModal}
        onDismiss={() => setShowTokenModal(false)}
        token={probeToken}
      />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Probe"
        body="Are you sure you want to delete this Probe?"
        confirmText="Delete Probe"
        onConfirm={handleDelete}
        onDismiss={() => setShowDeleteModal(false)}
      />
    </>
  );
};
