import React from 'react';
import { Button } from '@grafana/ui';

import { ROUTES } from 'types';
import { useNavigation } from 'hooks/useNavigation';

export function AddNewCheckButton() {
  const navigate = useNavigation();
  return (
    <Button variant="primary" onClick={() => navigate(ROUTES.ChooseCheckType)} type="button">
      Add new check
    </Button>
  );
}
