import { Button } from '@grafana/ui';
import { useNavigation } from 'hooks/useNavigation';
import React from 'react';
import { ROUTES } from 'types';

export function AddNewCheckButton() {
  const navigate = useNavigation();
  return (
    <Button variant="primary" onClick={() => navigate(ROUTES.ChooseCheckType)} type="button">
      Add new check
    </Button>
  );
}
