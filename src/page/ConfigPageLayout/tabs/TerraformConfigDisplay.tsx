import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { Clipboard } from 'components/Clipboard';

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
      <Clipboard
        highlight={['<GRAFANA_SERVICE_TOKEN>', '<SM_ACCESS_TOKEN>']}
        content={content}
        className={styles.clipboard}
        isCode
      />
    </>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    clipboard: css({
      maxHeight: 500,
      marginTop: 10,
      marginBottom: 10,
    }),
    codeLink: css({
      fontFamily: theme.typography.code.fontFamily,
      fontSize: '0.8571428571em',
    }),
  };
}
