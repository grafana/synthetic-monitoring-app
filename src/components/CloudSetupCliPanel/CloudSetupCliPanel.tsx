import React, { useEffect, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { ClipboardButton, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackCloudSetupCliCommandCopied, trackCloudSetupCliPanelShown } from 'features/tracking/cloudSetupEvents';
import { trackFaroUserAction } from 'features/tracking/userAction';

import { FaroEvent, FaroUserAction, reportError } from 'faro';

export function CloudSetupCliPanel() {
  const styles = useStyles2(getStyles);
  const stackUrl = config.appUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const cliCommand = `npx @grafana/cloud-setup synthetics --stack ${stackUrl}`;
  const [copyFailed, setCopyFailed] = useState(false);
  // Guarded so StrictMode's double-invoked effect reports a single view.
  const shownTrackedRef = useRef(false);

  useEffect(() => {
    if (!shownTrackedRef.current) {
      shownTrackedRef.current = true;
      trackCloudSetupCliPanelShown();
    }
  }, []);

  return (
    <Stack direction="column" gap={1}>
      <div className={styles.commandRow}>
        <code className={styles.command}>
          <span className={styles.executable}>npx</span> <span className={styles.argument}>@grafana/cloud-setup</span>{' '}
          synthetics <span className={styles.flag}>--stack</span> <span className={styles.argument}>{stackUrl}</span>
        </code>
        <ClipboardButton
          aria-label={t('cloudSetupCliPanel.copyCommand', 'Copy command')}
          getText={() => cliCommand}
          icon="clipboard-alt"
          size="sm"
          fill="text"
          variant="secondary"
          onClipboardCopy={() => {
            setCopyFailed(false);
            trackFaroUserAction(FaroUserAction.CloudSetupCliCommandCopied);
            trackCloudSetupCliCommandCopied();
          }}
          onClipboardError={(_, error) => {
            setCopyFailed(true);
            reportError(String(error), FaroEvent.CloudSetupCliCommandCopyFailed);
          }}
        >
          <Trans i18nKey="cloudSetupCliPanel.copy">Copy</Trans>
        </ClipboardButton>
      </div>
      {copyFailed && (
        <div role="alert">
          <Text color="error" variant="bodySmall">
            <Trans i18nKey="cloudSetupCliPanel.copyFailed">Could not copy. Select and copy the command above.</Trans>
          </Text>
        </div>
      )}
      <Text variant="bodySmall" color="secondary" textAlignment="center">
        <Trans i18nKey="cloudSetupCliPanel.requirements">Requires Node.js 22.6+ · Uses Grafana Assistant tokens</Trans>
      </Text>
    </Stack>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    commandRow: css({
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      width: '100%',
      padding: theme.spacing(1.5),
      border: `1px solid ${theme.colors.border.medium}`,
      borderRadius: theme.shape.radius.default,
      background: theme.components.input.background,
      color: theme.colors.text.primary,
      textAlign: 'left',
    }),
    command: css({
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightRegular,
      color: 'inherit',
      background: 'none',
      border: 'none',
      padding: 0,
      userSelect: 'text',
      cursor: 'text',
    }),
    executable: css({ color: theme.colors.success.text }),
    argument: css({ color: theme.colors.info.text }),
    flag: css({ color: theme.colors.warning.text }),
  };
}
