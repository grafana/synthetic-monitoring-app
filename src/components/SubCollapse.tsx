import { Label } from '@grafana/ui';
import React, { FC, useState } from 'react';

interface Props {
  title: string;
}

export const SubCollapse: FC<Props> = ({ children, title }) => {
  return (
    <div>
      <Label>{title}</Label>
      {children}
    </div>
  );
};
