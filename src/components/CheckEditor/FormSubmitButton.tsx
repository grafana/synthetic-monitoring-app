import React from 'react';
import { Button, ButtonProps } from '@grafana/ui';
import { DataTestIds } from 'test/dataTestIds';

import { useCheckEditorContext } from './CheckEditorContext';

export function FormSubmitButton({
  children = 'Save',
  variant = undefined,
}: {
  children?: React.ReactNode;
  variant?: ButtonProps['variant'];
}) {
  const { formId, submitDisabled, isLastSection, allSectionsVisited } = useCheckEditorContext();

  return (
    <Button
      form={formId}
      data-testid={DataTestIds.CHECK_FORM_SUBMIT_BUTTON}
      disabled={submitDisabled}
      key="submit"
      type="submit"
      variant={variant ?? (isLastSection || allSectionsVisited ? 'primary' : 'secondary')}
    >
      {children}
    </Button>
  );
}
