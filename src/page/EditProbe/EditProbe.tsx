import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, ConfirmModal } from '@grafana/ui';

import { type Probe, type ProbePageParams, ROUTES } from 'types';
import { canEditProbes } from 'utils';
import { useDeleteProbe, useProbe, useUpdateProbe } from 'data/useProbes';
import { useNavigation } from 'hooks/useNavigation';
import { PluginPage } from 'components/PluginPage';
import { ProbeEditor } from 'components/ProbeEditor';
import { ProbeStatus } from 'components/ProbeStatus';
import { ProbeTokenModal } from 'components/ProbeTokenModal';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

import { getErrorInfo, getTitle } from './EditProbe.utils';

export const EditProbe = () => {
  const [probe, setProbe] = useState<Probe>();

  return (
    <PluginPage pageNav={{ text: getTitle(probe) }}>
      <QueryErrorBoundary>
        <EditProbeFetch onProbeFetch={setProbe} />
      </QueryErrorBoundary>
    </PluginPage>
  );
};

const EditProbeFetch = ({ onProbeFetch }: { onProbeFetch: (probe: Probe) => void }) => {
  const { id } = useParams<ProbePageParams>();
  const { data: probe, isLoading } = useProbe(Number(id));
  const navigate = useNavigation();

  useEffect(() => {
    if (!probe && !isLoading) {
      navigate(ROUTES.Probes);
    }

    if (probe) {
      onProbeFetch(probe);
    }
  }, [isLoading, navigate, onProbeFetch, probe]);

  if (!probe) {
    return null;
  }

  return <EditProbeContent probe={probe} />;
};

const EditProbeContent = ({ probe }: { probe: Probe }) => {
  const navigate = useNavigation();
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [probeToken, setProbeToken] = useState(``);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const onUpdateSuccess = useCallback(() => {
    navigate(ROUTES.Probes);
  }, [navigate]);

  const onDeleteSuccess = useCallback(() => {
    setShowDeleteModal(false);
    navigate(ROUTES.Probes);
  }, [navigate]);

  const { mutate: onUpdate, error: updateError } = useUpdateProbe({ onSuccess: onUpdateSuccess });
  const { mutate: onDelete, error: deleteError } = useDeleteProbe({ onSuccess: onDeleteSuccess });

  const handleSubmit = useCallback(
    (formValues: Probe) => {
      return onUpdate({
        ...probe,
        ...formValues,
      });
    },
    [onUpdate, probe]
  );

  useEffect(() => {
    if (deleteError) {
      setShowDeleteModal(false);
    }
  }, [deleteError]);

  const actions = useMemo(
    () =>
      canEditProbes(probe) ? (
        <Button type="button" variant="destructive" onClick={() => setShowDeleteModal(true)}>
          Delete Probe
        </Button>
      ) : null,
    [probe]
  );

  const onReset = useCallback((token: string) => {
    setShowTokenModal(true);
    setProbeToken(token);
  }, []);

  return (
    <>
      <ProbeEditor
        actions={actions}
        errorInfo={getErrorInfo(updateError, deleteError)}
        onSubmit={handleSubmit}
        probe={probe}
        submitText="Update probe"
        supportingContent={<ProbeStatus probe={probe} onReset={onReset} />}
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
        onConfirm={() => onDelete(probe)}
        onDismiss={() => setShowDeleteModal(false)}
      />
    </>
  );
};
