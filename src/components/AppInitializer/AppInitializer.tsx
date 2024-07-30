import React, { PropsWithChildren, useState } from 'react';
import { Alert, Button } from '@grafana/ui';

import { ROUTES } from 'types';
import { hasGlobalPermission } from 'utils';

import { SetupModal } from './SetupModal';

interface Props {
  redirectTo?: ROUTES;
  buttonText: string;
}

export const AppInitializer = ({ redirectTo, buttonText }: PropsWithChildren<Props>) => {
  const canInitialize = hasGlobalPermission(`datasources:create`);
  const [open, setOpen] = useState(false);

  if (!canInitialize) {
    return (
      <Alert title="" severity="info">
        Contact your administrator to get you started.
      </Alert>
    );
  }

  return (
    <div>
      <Button onClick={() => setOpen(true)} size="lg">
        {buttonText}
      </Button>
      {open && <SetupModal onDismiss={() => setOpen(false)} redirectTo={redirectTo} />}
    </div>
  );
};
