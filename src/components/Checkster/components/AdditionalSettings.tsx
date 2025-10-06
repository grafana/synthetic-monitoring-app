import React, { Fragment, PropsWithChildren } from 'react';
import { Button, Stack } from '@grafana/ui';

import { Indent } from './ui/Indent';
import { SecondaryContainer } from './ui/SecondaryContainer';

interface AdditionalSettingsProps extends PropsWithChildren {
  buttonLabel?: string;
  indent?: true;
  isOpen?: boolean;
}
export function AdditionalSettings({
  buttonLabel = 'Additional settings',
  children,
  indent,
  isOpen: externalIsOpen,
}: AdditionalSettingsProps) {
  const [isOpen, setIsOpen] = React.useState(externalIsOpen);

  const ContentWrapper = indent ? Indent : Fragment;

  return (
    <Stack direction="column" gap={1}>
      <div>
        <Button
          aria-expanded={isOpen}
          fill="text"
          icon={isOpen ? `arrow-down` : `arrow-right`}
          onClick={() => setIsOpen((value) => !value)}
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
