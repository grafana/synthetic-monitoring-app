import React from 'react';
import { Button } from '@grafana/ui';

interface RequestTestProps {
  disabled?: boolean;
  label?: string;
  onClick?: () => void;
}

export const RequestTest = ({ disabled, label = `Test`, onClick }: RequestTestProps) => {
  // todo: temporarily disabling the test button for all requests
  if (!onClick || true) {
    return null;
  }

  return (
    <Button disabled={disabled} onClick={onClick} type="button">
      {label}
    </Button>
  );
};
