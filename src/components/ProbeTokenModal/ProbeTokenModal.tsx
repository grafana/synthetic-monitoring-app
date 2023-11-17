import React from 'react';
import { Alert, Button, HorizontalGroup, Modal, VerticalGroup } from '@grafana/ui';

import { Clipboard } from 'components/Clipboard';
import { DocsLink } from 'components/DocsLink';

type TokenModalProps = {
  actionText: string;
  isOpen: boolean;
  onDismiss: () => void;
  token: string;
};

export const ProbeTokenModal = ({ actionText, isOpen, onDismiss, token }: TokenModalProps) => {
  return (
    <Modal isOpen={isOpen} title="Probe Authentication Token" onDismiss={onDismiss}>
      <Alert severity="warning" title="Note">
        This is the only time you will see this token. If you need to view it again, you will need to reset the token.
      </Alert>
      <VerticalGroup spacing="md">
        <Clipboard content={token} />
        <HorizontalGroup justify="space-between">
          <DocsLink article="addPrivateProbe">Learn how to run a private probe</DocsLink>
          <Button onClick={onDismiss}>{actionText}</Button>
        </HorizontalGroup>
      </VerticalGroup>
    </Modal>
  );
};
