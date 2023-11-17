import React from 'react';
import { Alert, Modal, VerticalGroup } from '@grafana/ui';

import { Clipboard } from 'components/Clipboard';
import { DocsLink } from 'components/DocsLink';

type TokenModalProps = {
  isOpen: boolean;
  onDismiss: () => void;
  token: string;
};

export const ProbeTokenModal = ({ isOpen, onDismiss, token }: TokenModalProps) => {
  return (
    <Modal isOpen={isOpen} title="Probe Authentication Token" onDismiss={onDismiss}>
      <VerticalGroup spacing="md">
        <Clipboard content={token} />
        <DocsLink article="addPrivateProbe">Learn how to run a private probe</DocsLink>

        <Alert severity="warning" title="Note">
          This is the only time you will see this token. If you need to view it again, you will need to reset the token.
        </Alert>
      </VerticalGroup>
    </Modal>
  );
};
