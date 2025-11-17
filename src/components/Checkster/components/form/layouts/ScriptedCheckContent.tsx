import React, { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackNeedHelpScriptsButtonClicked } from 'features/tracking/checkFormEvents';

import { CheckType } from '../../../../../types';
import { CheckFormValues } from 'types';
import { useChecksterContext } from 'components/Checkster/contexts/ChecksterContext';
import { useFeatureTabsContext } from 'components/Checkster/contexts/FeatureTabsContext';

import { ExampleScript } from '../../../../ScriptExamplesMenu/constants';
import { SCRIPT_EXAMPLES } from '../../../../WelcomeTabs/constants';
import { SECONDARY_CONTAINER_ID } from '../../../constants';
import { ScriptExamples } from '../../ScriptExamples';
import { Column } from '../../ui/Column';
import { SectionContent } from '../../ui/SectionContent';
import { FormInstanceField } from '../FormInstanceField';
import { FormJobField } from '../FormJobField';
import { FormTabContent, FormTabs } from '../FormTabs';
import { GenericScriptField } from '../generic/GenericScriptField';

interface ScriptedCheckSectionProps {
  scriptField?: `settings.${CheckType.Scripted | CheckType.Browser}.script`;
  examples?: ExampleScript[];
}

export const SCRIPTED_CHECK_FIELDS = ['job', 'target', 'settings.scripted.script'];

// Don't set label here, set it explicitly, where the component is used (for readability)
export function ScriptedCheckContent({
  examples = SCRIPT_EXAMPLES,
  scriptField = 'settings.scripted.script',
}: ScriptedCheckSectionProps) {
  const hasExamples = examples && examples?.length > 0;
  const styles = useStyles2(getStyles);
  const [isFullSection, setIsFullSection] = useState(false);
  const {
    formState: { errors, submitCount },
  } = useFormContext<CheckFormValues>();
  const prevSubmitCountRef = useRef(submitCount);

  // Auto-collapse editor when form is submitted with field errors
  useEffect(() => {
    const hasFieldErrors = !!(errors.job || errors.target);
    const submitCountChanged = submitCount !== prevSubmitCountRef.current;

    if (isFullSection && submitCountChanged && hasFieldErrors) {
      setIsFullSection(false);
    }

    prevSubmitCountRef.current = submitCount;
  }, [submitCount, errors.job, errors.target, isFullSection]);

  return (
    <SectionContent noWrapper>
      {!isFullSection && (
        <div className={styles.fieldsContainer}>
          <FormJobField field="job" />
          <FormInstanceField field="target" />
        </div>
      )}
      <Column fill>
        <FormTabs actions={<HelpButton />}>
          <FormTabContent label="Script" fillVertical vanilla>
            <GenericScriptField
              field={scriptField}
              isExpanded={isFullSection}
              onToggleExpand={() => setIsFullSection(!isFullSection)}
            />
          </FormTabContent>
          {hasExamples && (
            <FormTabContent label="Examples" fillVertical vanilla className={styles.codeSnippetWrapper}>
              <ScriptExamples examples={examples} />
            </FormTabContent>
          )}
        </FormTabs>
      </Column>
    </SectionContent>
  );
}

const HelpButton = () => {
  const { setActive } = useFeatureTabsContext();
  const { checkType } = useChecksterContext();
  const source = `${checkType}_check`;

  return (
    <Button
      type="button"
      onClick={() => {
        setActive('Docs');
        document.getElementById(SECONDARY_CONTAINER_ID)?.focus();
        trackNeedHelpScriptsButtonClicked({ source });
      }}
      // variant=""
      fill="text"
      icon="k6"
      tooltip="Synthetic Monitoring scripts are built on top of Grafana k6. Click to learn more about authoring scripts."
    >
      Need help writing scripts?
    </Button>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    fieldsContainer: css`
      display: flex;
      gap: ${theme.spacing(2)};
      padding: ${theme.spacing(0, 2)};
      flex-shrink: 0;
    `,
    codeSnippetWrapper: css`
      // Handle code snippet border
      & > div,
      & > div > div {
        border: none;
      }

      // Change code snippet menu background
      & section > div > div {
        background-color: ${theme.colors.background.primary};
      }
    `,
  };
}
