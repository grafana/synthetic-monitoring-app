import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { highlight, languages } from 'prismjs';
import { UI_TEST_ID } from 'test/dataTestIds';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { CopyToClipboard } from 'components/Clipboard/CopyToClipboard';
import { getPrismCodeStyle } from 'components/TerraformConfig/prismStyles';

import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-hcl';

interface CodeBlockDisplayProps {
  content: string;
  title: string;
  language: 'bash' | 'hcl';
  showProbeTokenWarning?: boolean;
}

export function CodeBlockDisplay({ content, title, language, showProbeTokenWarning }: CodeBlockDisplayProps) {
  const styles = useStyles2(getStyles);

  const highlightedCode = useMemo(() => {
    if (!content) {
      return '';
    }
    return highlight(content, languages[language], language);
  }, [content, language]);

  return (
    <>
      <Text element="h4" weight="medium">
        {title}
      </Text>
      {showProbeTokenWarning && (
        <Text element="span" color="secondary">
          Replace{' '}
          <TextLink href={`${generateRoutePath(AppRoutes.Config)}/access-tokens`}>
            <strong className={styles.codeLink}>{'<PROBE_ACCESS_TOKEN>'}</strong>
          </TextLink>{' '}
          with each probe&apos;s access token.
        </Text>
      )}
      <div className={styles.codeContainer}>
        <pre className={styles.pre} data-testid={UI_TEST_ID.preformatted}>
          <code className={styles.code} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
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
      fontSize: theme.typography.bodySmall.fontSize,
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

