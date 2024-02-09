import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Modal, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { FaroEvent, reportEvent } from 'faro';
import { useTerraformConfig } from 'hooks/useTerraformConfig';
import { Clipboard } from 'components/Clipboard';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

const getStyles = (theme: GrafanaTheme2) => ({
  modal: css`
    max-height: 100%;
  `,
  clipboard: css`
    max-height: 500px;
    margin-top: 10px;
    margin-bottom: 10px;
  `,
  text: css`
    max-width: 600px;
  `,
  vericalSpace: css`
    margin-top: 10px;
    margin-bottom: 10px;
  `,
});

export const TerraformConfig = () => {
  const styles = useStyles2(getStyles);

  return (
    <div>
      <h5>Terraform</h5>
      <div>You can manage synthetic monitoring checks via Terraform. Export your current checks as config</div>
      <QueryErrorBoundary
        fallback={
          <Button className={styles.vericalSpace} disabled icon="fa fa-spinner">
            Generate config
          </Button>
        }
      >
        <GenerateButton />
      </QueryErrorBoundary>
    </div>
  );
};

const GenerateButton = () => {
  const { config, checkCommands, error } = useTerraformConfig();
  const [showModal, setShowModal] = useState(false);
  const styles = useStyles2(getStyles);

  return (
    <>
      <Button
        className={styles.vericalSpace}
        onClick={() => {
          reportEvent(FaroEvent.SHOW_TERRAFORM_CONFIG);
          setShowModal(true);
        }}
      >
        Generate config
      </Button>
      <Modal
        title="Terraform config"
        isOpen={showModal}
        onDismiss={() => setShowModal(false)}
        contentClassName={styles.modal}
      >
        {error && <Alert title={error.message} />}
        {config && checkCommands && (
          <>
            <Alert title="Terraform and JSON" severity="info">
              The exported config is using{' '}
              <a href="https://www.terraform.io/docs/language/syntax/json.html">Terraform JSON syntax</a>. You can place
              this config in a file with a <strong>tf.json</strong> extension and import as a module. See Terraform
              providor{' '}
              <a href="https://registry.terraform.io/providers/grafana/grafana/latest/docs">docs for more details</a>
            </Alert>
            <h5>tf.json</h5>
            <Clipboard content={JSON.stringify(config, null, 2)} className={styles.clipboard} />
            <h5>Import existing checks into Terraform</h5>
            <Clipboard content={checkCommands.join(' && ')} className={styles.clipboard} truncate />
            <h5>Import custom probes into Terraform</h5>
            <Clipboard
              content="terraform import grafana_synthetic_monitoring_probe.{{probe_name}} {{probe_id}}:{{probe_auth_token}}"
              className={styles.clipboard}
            />
          </>
        )}
      </Modal>
    </>
  );
};
