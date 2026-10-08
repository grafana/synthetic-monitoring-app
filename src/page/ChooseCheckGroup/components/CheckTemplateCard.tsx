import React from 'react';
import { IconName } from '@grafana/ui';
import { CHECKS_TEST_ID } from 'test/dataTestIds';

import { ChoiceTile } from 'components/ChoiceTile';

interface Props {
  title: string;
  icon?: IconName;
  description?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export function CheckTemplateCard({ title, icon = 'file-alt', description, disabled, onSelect }: Props) {
  return (
    <ChoiceTile
      data-testid={CHECKS_TEST_ID.templateCard}
      title={title}
      icon={icon}
      description={description}
      disabled={disabled}
      onClick={onSelect}
    />
  );
}
