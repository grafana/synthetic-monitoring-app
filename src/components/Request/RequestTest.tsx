import React from 'react';
import { Button } from '@grafana/ui';

interface RequestTestProps {
  disabled?: boolean;
  label?: string;
  onClick: () => void;
}

export const RequestTest = ({ disabled, label = `Test`, onClick }: RequestTestProps) => {
  return (
    <Button disabled={disabled} onClick={onClick} type="button">
      {label}
    </Button>
  );
};
