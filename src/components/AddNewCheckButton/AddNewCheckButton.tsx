import React from 'react';
import { Button } from '@grafana/ui';

import { ROUTES } from 'routing/types';
import { getUserPermissions } from 'data/permissions';
import { useNavigation } from 'hooks/useNavigation';

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
