import React, { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { ClipboardButton, Tab, TabContent, TabsBar, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { highlight, languages } from 'prismjs';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';
import {
  trackTerraformConfigCopied,
  trackTerraformFormatChanged,
  trackTerraformFullConfigClicked,
} from 'features/tracking/checkFormEvents';

import { CheckFormValues } from 'types';

import { Column } from '../../components/ui/Column';
import { useCheckTerraformConfig } from './useCheckTerraformConfig';
import 'prismjs/components/prism-hcl';
import 'prismjs/components/prism-json';

type TerraformFormat = 'hcl' | 'json';

const FORMAT_LABELS: Record<TerraformFormat, string> = {
  hcl: 'HCL',
  json: 'JSON',
};

export function TerraformPanel() {
  const styles = useStyles2(getStyles);
  const [activeFormat, setActiveFormat] = useState<TerraformFormat>('hcl');
  const { getValues } = useFormContext<CheckFormValues>();
  const formValues = getValues();
  const { hclConfig, jsonConfig } = useCheckTerraformConfig(formValues);

  const content = activeFormat === 'hcl' ? hclConfig : jsonConfig;
  const langSyntax = activeFormat === 'hcl' ? 'hcl' : 'json';

  const highlightedCode = useMemo(() => {
    if (!content) {
      return '';
    }
    return highlight(content, languages[langSyntax], langSyntax);
  }, [content, langSyntax]);

  if (!content) {
    return (
      <div className={styles.root} data-testid={CHECKSTER_TEST_ID.feature.terraform.root}>
        <Text color="secondary">
          Fill in the check details to see the Terraform configuration preview.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.root} data-testid={CHECKSTER_TEST_ID.feature.terraform.root}>
      <Column gap={2} className={styles.column}>
        <Text color="secondary">
          Preview the Terraform resource configuration for this check.{' '}
          <TextLink href="/a/grafana-synthetic-monitoring-app/config/terraform" external={false}>
            View full configuration and instructions
          </TextLink>
          .
        </Text>

        <div className={styles.configContainer}>
          <div className={styles.header}>
            <TabsBar className={styles.tabsBar}>
              {(['hcl', 'json'] as TerraformFormat[]).map((format) => (
                <Tab
                  key={format}
                  label={FORMAT_LABELS[format]}
                  active={activeFormat === format}
                  onChangeTab={() => setActiveFormat(format)}
                  data-testid={CHECKSTER_TEST_ID.feature.terraform.tab(format)}
                />
              ))}
            </TabsBar>

            <ClipboardButton
              icon="clipboard-alt"
              variant="secondary"
              size="sm"
              getText={() => content}
              data-testid={CHECKSTER_TEST_ID.feature.terraform.copyButton}
            >
              Copy
            </ClipboardButton>
          </div>

          <TabContent className={styles.tabContent}>
            <pre className={styles.pre}>
              <code
                className={styles.code}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
                data-testid={CHECKSTER_TEST_ID.feature.terraform.codeContent}
              />
            </pre>
          </TabContent>
        </div>
      </Column>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    root: css({
      padding: theme.spacing(1, 1, 1, 0),
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      width: 0,
      minWidth: '100%',
    }),
    column: css({
      width: 0,
      minWidth: '100%',
    }),
    configContainer: css({
      display: 'flex',
      flexDirection: 'column',
      border: `1px solid ${theme.colors.border.medium}`,
      borderRadius: theme.shape.radius.default,
      overflow: 'hidden',
      flex: 1,
      minHeight: 0,
      width: 0,
      minWidth: '100%',
    }),
    header: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing(0, 1),
      borderBottom: `1px solid ${theme.colors.border.medium}`,
    }),
    tabsBar: css({
      borderBottom: 'none',
      '& > [role="tablist"]': {
        height: 'auto',
      },
    }),
    tabContent: css({
      flex: 1,
      overflow: 'auto',
      backgroundColor: theme.colors.background.canvas,
      width: 0,
      minWidth: '100%',
    }),
    pre: css({
      margin: 0,
      padding: 0,
      backgroundColor: 'transparent',
    }),
    code: css({
      display: 'block',
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      fontSize: 12,
      lineHeight: 1.5,
      padding: theme.spacing(2),
      whiteSpace: 'pre',
      color: theme.colors.text.primary,
      '.token.boolean, .token.string': {
        color: theme.colors.success.text,
      },
      '.token.constant': {
        color: theme.colors.info.text,
      },
      '.token.function': {
        color: theme.colors.text.primary,
      },
      '.token.punctuation': {
        color: theme.colors.text.secondary,
      },
      '.token.keyword': {
        color: theme.colors.info.text,
      },
      '.token.number': {
        color: theme.colors.success.text,
      },
      '.token.operator': {
        color: theme.colors.text.secondary,
        backgroundColor: 'transparent',
      },
      '.token.comment': {
        color: theme.colors.text.disabled,
      },
      '.token.property': {
        color: theme.colors.info.text,
      },
    }),
  };
}

