import { Alert, Button, Link, Modal } from '@grafana/ui';
import { InstanceContext } from 'contexts/InstanceContext';
import React, { useContext, useState } from 'react';
import { Clipboard } from 'components/Clipboard';

export const AccessToken = () => {
  const { instance } = useContext(InstanceContext);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [token, setToken] = useState<string | undefined>();

  const showTokenModal = async () => {
    try {
      const token = await instance.api?.createApiToken();
      setToken(token);
      setShowModal(true);
    } catch (e) {
      const cast = e as Error;
      setError(cast.message ?? 'There was an error creating a new access token');
    }
  };
  return (
    <div>
      <h5>Access tokens</h5>
      <div>
        <div>
          You can use an SM access token to authenticate with the synthetic monitoring api. Check out the{' '}
          <Link href="https://github.com/grafana/synthetic-monitoring-api-go-client">
            synthetic monitoring go client
          </Link>{' '}
          or the{' '}
          <Link href="https://registry.terraform.io/providers/grafana/grafana/latest/docs">
            Grafana Terraform Provider
          </Link>{' '}
          documentation to learn more about how to interact with the synthetic monitoring API.
        </div>
        <Button onClick={() => showTokenModal()}>Generate access token</Button>
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
