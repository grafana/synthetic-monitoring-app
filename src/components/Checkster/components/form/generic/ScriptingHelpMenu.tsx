import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Dropdown, Menu, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackNeedHelpScriptsButtonClicked } from 'features/tracking/checkFormEvents';

import { useChecksterContext } from 'components/Checkster/contexts/ChecksterContext';
import { useFeatureTabsContext } from 'components/Checkster/contexts/FeatureTabsContext';

import { ExampleScript } from '../../../../ScriptExamplesMenu/constants';
import { SECONDARY_CONTAINER_ID } from '../../../constants';

interface ScriptingHelpMenuProps {
  examples?: ExampleScript[];
  onRequestLoadExample: (example: ExampleScript) => void;
}

export function ScriptingHelpMenu({ examples, onRequestLoadExample }: ScriptingHelpMenuProps) {
  const styles = useStyles2(getStyles);
  const { setActive } = useFeatureTabsContext();
  const { checkType } = useChecksterContext();
  const hasExamples = examples && examples.length > 0;

  return (
    <Dropdown
      overlay={
        <Menu ariaLabel="Need help?">
          {hasExamples && (
            <Menu.Item
              label="Load example"
              description="Replaces the current script"
              childItems={examples!.map((example) => (
                <Menu.Item
                  key={example.value}
                  label={example.label}
                  onClick={() => onRequestLoadExample(example)}
                />
              ))}
            />
          )}
          <Menu.Item
            label="Open documentation"
            onClick={() => {
              setActive('Docs', true);
              document.getElementById(SECONDARY_CONTAINER_ID)?.focus();
              trackNeedHelpScriptsButtonClicked({ source: `${checkType}_check` });
            }}
          />
        </Menu>
      }
    >
      <Button
        type="button"
        variant="primary"
        fill="text"
        size="sm"
        icon="angle-down"
        iconPlacement="right"
        className={styles.trigger}
      >
        Need help?
      </Button>
    </Dropdown>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    trigger: css`
      gap: ${theme.spacing(0.25)};
    `,
  };
}
