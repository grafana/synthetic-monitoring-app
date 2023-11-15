import React from 'react';
import { Modal } from '@grafana/ui';

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
      <Clipboard content={token} />
      <DocsLink article="addPrivateProbe">Learn how to run a private probe</DocsLink>
    </Modal>
  );
};
