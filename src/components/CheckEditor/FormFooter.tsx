import React from 'react';
import { Button, Icon, Stack, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackNavigateWizardForm } from 'features/tracking/checkFormEvents';
import { DataTestIds } from 'test/dataTestIds';

import { FORM_SECTION_ORDER } from '../CheckForm/constants';
import { useCheckEditorContext } from './CheckEditorContext';
import { FormSubmitButton } from './FormSubmitButton';

export function FormFooter() {
  const theme = useTheme2();
  const {
    allSectionsVisited,
    activeSection,
    goToSection,
    getSectionLabel,
    isFirstSection,
    isLastSection,
    checkMeta: { checkState, checkType },
  } = useCheckEditorContext();

  const prevSection = activeSection - 1;
  const nextSection = activeSection + 1;

  const handleBackButton = () => {
    if (isFirstSection) {
      return;
    }
    goToSection(prevSection);
    trackNavigateWizardForm({
      checkState,
      checkType,
      component: 'back-button',
      step: FORM_SECTION_ORDER[prevSection],
    });
  };

  const handleForwardButton = () => {
    if (isLastSection) {
      return;
    }
    goToSection(nextSection);
    trackNavigateWizardForm({
      checkState,
      checkType,
      component: 'forward-button',
      step: FORM_SECTION_ORDER[nextSection],
    });
  };

  return (
    <div
      data-testid={DataTestIds.ACTIONS_BAR}
      className={css`
        border-top: 1px solid ${theme.colors.border.medium};
        width: 100%;
        margin: 0 auto;
        padding: 16px;
        display: flex;
        justify-content: space-between;
      `}
    >
      {!isFirstSection ? (
        <Button icon="arrow-left" variant="secondary" onClick={handleBackButton}>
          {getSectionLabel(prevSection)}
        </Button>
      ) : (
        <div />
      )}
      {!isLastSection ? (
        <Button onClick={handleForwardButton} variant={allSectionsVisited ? 'secondary' : 'primary'}>
          <Stack alignItems="center">
            <span>{getSectionLabel(nextSection)}</span>
            <Icon size="lg" name="arrow-right" />
          </Stack>
        </Button>
      ) : (
        <FormSubmitButton />
      )}
    </div>
  );
}
