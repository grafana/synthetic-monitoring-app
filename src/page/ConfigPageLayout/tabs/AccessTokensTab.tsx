import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, ConfirmModal, Modal, Space, Spinner, TextLink, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { TokenInfo } from 'datasource/responses.types';
import { getUserPermissions } from 'data/permissions';
import { useCreateToken, useDeleteToken, useTokens } from 'data/useTokens';
import { Clipboard } from 'components/Clipboard';
import { ContactAdminAlert } from 'page/ContactAdminAlert';

import { ConfigContent } from '../ConfigContent';

const PAGE_SIZE = 50;

export function AccessTokensTab() {
  const { canReadTokens, canWriteTokens, canDeleteTokens } = getUserPermissions();
  const styles = useStyles2(getStyles);

  // write permission implies read for users who have not had the explicit :read
  // permission assigned yet (e.g. before a plugin.json update is rolled out).
  const canViewList = canReadTokens || canWriteTokens;

  const [offset, setOffset] = useState(0);

  // New token modal state
  const [showModal, setShowModal] = useState(false);
  const [newToken, setNewToken] = useState<string | undefined>();

  // Delete confirmation state
  const [tokenToDelete, setTokenToDelete] = useState<TokenInfo | null>(null);

  const { data, isLoading, isFetching } = useTokens(PAGE_SIZE, offset, canViewList);

  const createToken = useCreateToken({
    onSuccess: (token) => {
      setNewToken(token);
      setShowModal(true);
    },
  });

  const deleteToken = useDeleteToken({
    onSuccess: () => {
      setOffset(0);
    },
  });

  const tokens = data?.tokens ?? [];
  const totalCount = data?.totalCount ?? 0;
  const currentTokenId = data?.currentTokenId ?? 0;
  const hasMore = offset + PAGE_SIZE < totalCount;

  return (
    <ConfigContent title="Access tokens">
      {!canViewList && (
        <ContactAdminAlert
          title="Contact your administrator to generate Access Tokens"
          missingPermissions={['grafana-synthetic-monitoring-app.access-tokens:write']}
        />
      )}

      <ConfigContent.Section title="Synthetic Monitoring">
        You can use an SM access token to authenticate with the synthetic monitoring api. Check out the{' '}
        <TextLink icon="github" href="https://github.com/grafana/synthetic-monitoring-api-go-client" external>
          Synthetic Monitoring API Go client
        </TextLink>{' '}
        or the{' '}
        <TextLink
          href="https://registry.terraform.io/providers/grafana/grafana/latest/docs/resources/synthetic_monitoring_check"
          external
        >
          Grafana Terraform Provider
        </TextLink>{' '}
        documentation to learn more about how to interact with the synthetic monitoring API.
        <Space v={2} />
        <Button
          tooltip={!canWriteTokens ? 'You do not have permission to generate access tokens.' : undefined}
          disabled={!canWriteTokens}
          onClick={() => createToken.mutate()}
        >
          Generate access token
        </Button>
      </ConfigContent.Section>

      <ConfigContent.Section title="Existing tokens">
        {isLoading && canViewList && <Spinner />}
        {!isLoading && canViewList && tokens.length === 0 && <span>No tokens found.</span>}
        {canViewList && tokens.length > 0 && (
          <>
            <table className={styles.table}>
              <colgroup>
                <col className={styles.colId} />
                <col className={styles.colDate} />
                <col className={styles.colDate} />
                {canDeleteTokens && <col className={styles.colAction} />}
              </colgroup>
              <thead>
                <tr>
                  <th className={styles.th}>ID</th>
                  <th className={styles.th}>Created</th>
                  <th className={styles.th}>Last used</th>
                  {canDeleteTokens && <th className={styles.th} />}
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => {
                  const isCurrent = currentTokenId !== 0 && t.id === currentTokenId;
                  const revokeButton = (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isCurrent || deleteToken.isPending}
                      onClick={() => !isCurrent && setTokenToDelete(t)}
                    >
                      Revoke
                    </Button>
                  );

                  return (
                    <tr key={t.id} className={styles.tr}>
                      <td className={styles.td}>{t.id}</td>
                      <td className={styles.td}>{formatNano(t.created)}</td>
                      <td className={styles.td}>{formatNano(t.lastUsed)}</td>
                      {canDeleteTokens && (
                        <td className={cx(styles.td, styles.tdAction)}>
                          {isCurrent ? (
                            <Tooltip content="You cannot revoke the token currently in use.">
                              <span>{revokeButton}</span>
                            </Tooltip>
                          ) : (
                            revokeButton
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {hasMore && (
              <>
                <Space v={2} />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  disabled={isFetching}
                >
                  {isFetching ? <Spinner /> : `Load more (${totalCount - tokens.length - offset} remaining)`}
                </Button>
              </>
            )}
          </>
        )}
      </ConfigContent.Section>

      <ConfigContent.Section title="Private probes">
        Each private probe has its own access token. You will only ever see the access token when you first create the
        private probe, and if you &quot;Reset access token&quot; for an already created probe. If you need to view it
        again, you will need to reset the token.
      </ConfigContent.Section>

      <Modal title="Access Token" isOpen={showModal} onDismiss={() => setShowModal(false)}>
        <>
          <p>Copy your access token now. You will not be able to see it again.</p>
          {newToken && <Clipboard content={newToken} />}
        </>
      </Modal>

      <ConfirmModal
        isOpen={!!tokenToDelete}
        title="Revoke access token"
        body={`Revoke the token created on ${tokenToDelete ? formatNano(tokenToDelete.created) : ''}? This action cannot be undone.`}
        confirmText="Revoke"
        onConfirm={() => {
          if (tokenToDelete) {
            deleteToken.mutate(tokenToDelete.id);
          }

          setTokenToDelete(null);
        }}
        onDismiss={() => setTokenToDelete(null)}
      />
    </ConfigContent>
  );
}

function formatNano(ns: number): string {
  if (ns === 0) {
    return 'Never';
  }

  return new Date(ns / 1_000_000).toISOString().slice(0, 16).replace('T', ' ');
}

// cx is a minimal class name joiner — avoids adding a new dependency.
function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getStyles(theme: GrafanaTheme2) {
  return {
    table: css({
      width: '100%',
      borderCollapse: 'collapse',
    }),
    colId: css({
      width: '60px',
    }),
    colDate: css({
      width: '180px',
    }),
    colAction: css({
      width: '90px',
    }),
    th: css({
      textAlign: 'left',
      padding: theme.spacing(1, 2, 1, 0),
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      whiteSpace: 'nowrap',
    }),
    tr: css({
      '&:not(:last-child) td': {
        borderBottom: `1px solid ${theme.colors.border.weak}`,
      },
    }),
    td: css({
      padding: theme.spacing(1, 2, 1, 0),
      verticalAlign: 'middle',
    }),
    tdAction: css({
      textAlign: 'right',
      paddingRight: 0,
    }),
  };
}
