import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Modal, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { FaroEvent, reportError, reportEvent } from 'faro';
import { useSMDS } from 'hooks/useSMDS';
import { Clipboard } from 'components/Clipboard';

const getStyles = (theme: GrafanaTheme2) => ({
  vericalSpace: css`
    margin-top: 10px;
  `,
});

export const AccessToken = () => {
  const smDS = useSMDS();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [token, setToken] = useState<string | undefined>();
  const styles = useStyles2(getStyles);

  const showTokenModal = async () => {
    try {
      reportEvent(FaroEvent.CREATE_ACCESS_TOKEN);
      const token = await smDS.createApiToken();
      setToken(token);
      setShowModal(true);
    } catch (e) {
      const cast = e as Error;
      reportError(cast, FaroEvent.CREATE_ACCESS_TOKEN);
      setError(cast.message ?? 'There was an error creating a new access token');
    }
  };
  return (
    <div>
      <h5>Access tokens</h5>
      <div>
        <div>
          You can use an SM access token to authenticate with the synthetic monitoring api. Check out the{' '}
          <a
            className="highlight-word"
            href="https://github.com/grafana/synthetic-monitoring-api-go-client"
            target="_blank"
            rel="noopener noreferrer"
          >
            Synthetic Monitoring API Go client
          </a>{' '}
          or the{' '}
          <a
            className="highlight-word"
            href="https://registry.terraform.io/providers/grafana/grafana/latest/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Grafana Terraform Provider
          </a>{' '}
          documentation to learn more about how to interact with the synthetic monitoring API.
        </div>
        <Button className={styles.vericalSpace} onClick={() => showTokenModal()}>
          Generate access token
        </Button>
      </div>
      <Modal title="Access Token" isOpen={showModal} onDismiss={() => setShowModal(false)}>
        <>
          {error && <Alert title={error} />}
          {token && <Clipboard content={token} />}
        </>
      </Modal>
    </div>
  );
};
