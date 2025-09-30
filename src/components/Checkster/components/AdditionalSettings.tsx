import React, { Fragment, PropsWithChildren } from 'react';
import { FieldPath } from 'react-hook-form';
import { Button, Stack } from '@grafana/ui';

import { CheckFormValues } from '../../../types';

import { Indent } from './ui/Indent';
import { SecondaryContainer } from './ui/SecondaryContainer';

interface AdditionalSettingsProps extends PropsWithChildren {
  buttonLabel?: string;
  // Required to expand settings when there are field errors
  // TODO: Consider fieldContext?
  containsFields?: Array<FieldPath<CheckFormValues>>;
  indent?: true;
}
export function AdditionalSettings({ buttonLabel = 'Additional settings', children, indent }: AdditionalSettingsProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const ContentWrapper = indent ? Indent : Fragment;

  return (
    <Stack direction="column" gap={1}>
      <div>
        <Button
          aria-expanded={isOpen}
          fill="text"
          icon={isOpen ? `arrow-down` : `arrow-right`}
          onClick={() => setIsOpen((v) => !v)}
          type="button"
        >
          {buttonLabel}
        </Button>
      </div>

      {isOpen && (
        <ContentWrapper>
          <SecondaryContainer>{children}</SecondaryContainer>
        </ContentWrapper>
      )}
    </Stack>
  );
}
