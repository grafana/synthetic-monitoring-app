import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PluginPage } from '@grafana/runtime';

import { ExtendedProbe, type Probe, type ProbePageParams, ROUTES } from 'types';
import { useExtendedProbe, useUpdateProbe } from 'data/useProbes';
import { useCanEditProbe } from 'hooks/useCanEditProbe';
import { useNavigation } from 'hooks/useNavigation';
import { DeleteProbeButton } from 'components/DeleteProbeButton';
import { ProbeEditor } from 'components/ProbeEditor';
import { ProbeStatus } from 'components/ProbeStatus';
import { ProbeTokenModal } from 'components/ProbeTokenModal';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

import { getErrorInfo, getTitle } from './EditProbe.utils';

export const EditProbe = () => {
  const [probe, setProbe] = useState<ExtendedProbe>();
  const canEdit = useCanEditProbe(probe);

  return (
    <PluginPage pageNav={{ text: getTitle(probe, canEdit) }}>
      <QueryErrorBoundary>
        <EditProbeFetch onProbeFetch={setProbe} />
      </QueryErrorBoundary>
    </PluginPage>
  );
};

const EditProbeFetch = ({ onProbeFetch }: { onProbeFetch: (probe: ExtendedProbe) => void }) => {
  const { id } = useParams<ProbePageParams>();
  const [probe, isLoading] = useExtendedProbe(Number(id));
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

const EditProbeContent = ({ probe }: { probe: ExtendedProbe }) => {
  const navigate = useNavigation();
  const canEdit = useCanEditProbe(probe);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [probeToken, setProbeToken] = useState(``);
  // const [showDeleteModal, setShowDeleteModal] = useState(false);

  const onUpdateSuccess = useCallback(() => {
    navigate(ROUTES.Probes);
  }, [navigate]);

  const { mutate: onUpdate, error: updateError } = useUpdateProbe({ onSuccess: onUpdateSuccess });

  const handleSubmit = useCallback(
    (formValues: Probe) => {
      return onUpdate({
        ...probe,
        ...formValues,
      });
    },
    [onUpdate, probe]
  );

  const errorInfo = getErrorInfo(updateError);

  const actions = useMemo(() => (canEdit ? <DeleteProbeButton probe={probe} /> : null), [canEdit, probe]);

  const onReset = useCallback((token: string) => {
    setShowTokenModal(true);
    setProbeToken(token);
  }, []);

  return (
    <>
      <ProbeEditor
        actions={actions}
        errorInfo={errorInfo}
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
    </>
  );
};
