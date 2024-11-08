import React from 'react';
import { Button } from '@grafana/ui';

import { ROUTES } from 'types';
import { useNavigation } from 'hooks/useNavigation';
import { getUserPermissions } from 'hooks/useUserPermissions';

export function AddNewCheckButton() {
  const navigate = useNavigation();
  const { canWriteChecks } = getUserPermissions();

  if (!canWriteChecks) {
    return null;
  }

  return (
    <Button variant="primary" onClick={() => navigate(ROUTES.ChooseCheckGroup)} type="button">
      Add new check
    </Button>
  );
}
