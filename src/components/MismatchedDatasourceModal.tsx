import React from 'react';
import { Button, Modal, Spinner } from '@grafana/ui';
import { css } from '@emotion/css';

interface Props {
  isOpen: boolean;
  onSubmit: () => void;
  isSubmitting: boolean;
  onDismiss: () => void;
  metricsFoundName: string;
  logsFoundName: string;
  logsExpectedName: string;
  metricsExpectedName: string;
}

export function MismatchedDatasourceModal({
  isOpen,
  onSubmit,
  isSubmitting,
  onDismiss,
  metricsFoundName,
  logsFoundName,
  logsExpectedName,
  metricsExpectedName,
}: Props) {
  return (
    <Modal isOpen={isOpen} title="Datasource selection">
      <p>
        It looks like there is a mismatch between the way Synthetic Monitoring was provisioned and the currently
        available datasources. This can happen when a Grafana instance is renamed, or if provisioning is incorrect.
        Proceed with found datasources?
      </p>
      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
        })}
      >
        <dt>Expecting metrics datasource:</dt>
        <dt>Found metrics datasource:</dt>
        <dd>{metricsExpectedName}</dd>
        <dd>{metricsFoundName}</dd>
        <dt>Expecting logs datasource:</dt>
        <dt>Found logs datasource:</dt>
        <dd>{logsExpectedName}</dd>
        <dd>{logsFoundName}</dd>
      </div>
      <Modal.ButtonRow>
        <Button variant="secondary" fill="outline" onClick={onDismiss}>
          Cancel
        </Button>
        <Button disabled={isSubmitting} onClick={onSubmit}>
          {isSubmitting ? <Spinner /> : 'Proceed'}
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
}
