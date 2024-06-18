import React from 'react';
import { Button } from '@grafana/ui';

interface RequestTestProps {
  label?: string;
  onClick: () => void;
}

export const RequestTest = ({ label = `Test`, onClick }: RequestTestProps) => {
  return (
    <Button onClick={onClick} type="button">
      {label}
    </Button>
  );
};
