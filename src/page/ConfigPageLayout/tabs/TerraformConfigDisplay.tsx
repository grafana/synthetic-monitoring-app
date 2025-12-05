import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { highlight, languages } from 'prismjs';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { CopyToClipboard } from 'components/Clipboard/CopyToClipboard';
import { getPrismCodeStyle } from 'components/TerraformConfig/prismStyles';

import 'prismjs/components/prism-hcl';
import 'prismjs/components/prism-json';

interface TerraformConfigDisplayProps {
  title: string;
  syntaxName: string;
  docsUrl: string;
  fileExtension: string;
  content: string;
}

export function TerraformConfigDisplay({ 
  title, 
  syntaxName, 
  docsUrl, 
  fileExtension, 
  content 
}: TerraformConfigDisplayProps) {
  const styles = useStyles2(getStyles);
  
  const langSyntax = fileExtension === '.tf' ? 'hcl' : 'json';
  
  const highlightedCode = useMemo(() => {
    if (!content) {
      return '';
    }
    return highlight(content, languages[langSyntax], langSyntax);
  }, [content, langSyntax]);

  return (
    <>
      <Alert title={title} severity="info">
        The exported config is using{' '}
        <TextLink href={docsUrl} external>
          {syntaxName}
        </TextLink>
        . You can place this config in a file with a <code>{fileExtension}</code> extension and import as a module. See the{' '}
        <TextLink href="https://registry.terraform.io/providers/grafana/grafana/latest/docs" external>
          Terraform provider docs
        </TextLink>{' '}
        for more details.
      </Alert>
      <Text element="span" color="secondary">
        Replace{' '}
        <TextLink href="https://grafana.com/docs/grafana/latest/administration/service-accounts/" external>
          <strong className={styles.codeLink}>{'<GRAFANA_SERVICE_TOKEN>'}</strong>
        </TextLink>{' '}
        and{' '}
        <TextLink href={`${generateRoutePath(AppRoutes.Config)}/access-tokens`}>
          <strong className={styles.codeLink}>{'<SM_ACCESS_TOKEN>'}</strong>
        </TextLink>
        , with their respective value.
      </Text>
      <div className={styles.codeContainer}>
        <pre className={styles.pre}>
          <code
            className={styles.code}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
        <CopyToClipboard
          className={styles.copyButton}
          variant="primary"
          fill="text"
          buttonText="Copy to clipboard"
          buttonTextCopied="Copied to clipboard"
          content={content}
        />
      </div>
    </>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    codeLink: css({
      fontFamily: theme.typography.code.fontFamily,
      fontSize: '0.8571428571em',
    }),
    codeContainer: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
      marginTop: theme.spacing(2),
    }),
    pre: css({
      margin: 0,
      padding: 0,
      backgroundColor: theme.colors.background.canvas,
      borderRadius: theme.shape.radius.default,
      border: `1px solid ${theme.colors.border.medium}`,
      overflowY: 'auto',
      maxHeight: '600px',
    }),
    code: getPrismCodeStyle(theme),
    copyButton: css({
      marginLeft: 'auto',
    }),
  };
}
