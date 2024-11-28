import React, { useState } from 'react';
import { Alert, Button, Modal, Space, TextLink } from '@grafana/ui';

import { FaroEvent, reportError, reportEvent } from 'faro';
import { getUserPermissions } from 'data/permissions';
import { useSMDS } from 'hooks/useSMDS';
import { Clipboard } from 'components/Clipboard';

import { ConfigContent } from '../ConfigContent';

export function AccessTokensTab() {
  const { canWriteTokens } = getUserPermissions();
  const smDS = useSMDS();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [token, setToken] = useState<string | undefined>();

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
    <ConfigContent title="Access tokens">
      <ConfigContent.Section title="Synthetic Monitoring">
        You can use an SM access token to authenticate with the synthetic monitoring api. Check out the{' '}
        <TextLink icon="github" href="https://github.com/grafana/synthetic-monitoring-api-go-client" external>
          Synthetic Monitoring API Go client
        </TextLink>{' '}
        or the{' '}
        <TextLink href="https://registry.terraform.io/providers/grafana/grafana/latest/docs" external>
          Grafana Terraform Provider
        </TextLink>{' '}
        documentation to learn more about how to interact with the synthetic monitoring API.
        <Space v={2} />
        <Button
          tooltip={!canWriteTokens ? 'You do not have permission to generate access tokens.' : undefined}
          disabled={!canWriteTokens}
          onClick={() => showTokenModal()}
        >
          Generate access token
        </Button>
      </ConfigContent.Section>

      <ConfigContent.Section title="Private probes">
        Each private probe has its own access token. You will only ever see the access token when you first create the
        private probe, and if you &quot;Reset access token&quot; for an already created probe. If you need to view it
        again, you will need to reset the token.
      </ConfigContent.Section>

      <Modal title="Access Token" isOpen={showModal} onDismiss={() => setShowModal(false)}>
        <>
          {error && <Alert title={error} />}
          {token && <Clipboard content={token} />}
        </>
      </Modal>
    </ConfigContent>
  );
}
