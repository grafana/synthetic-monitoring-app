import React, { useState } from 'react';
import { dateTimeFormat, dateTimeFormatTimeAgo } from '@grafana/data';
import { Alert, Button, ConfirmModal, Modal, Space, Spinner, TextLink, Tooltip, useTheme2 } from '@grafana/ui';

import { TokenInfo } from 'datasource/responses.types';
import { getUserPermissions } from 'data/permissions';
import { useCreateToken, useDeleteToken, useTokens } from 'data/useTokens';
import { Clipboard } from 'components/Clipboard';
import { Table, type TableColumn } from 'components/Table';
import { ContactAdminAlert } from 'page/ContactAdminAlert';

import { ConfigContent } from '../ConfigContent';

const PAGE_SIZE = 50;

export function AccessTokensTab() {
  const { canReadTokens, canWriteTokens, canDeleteTokens } = getUserPermissions();
  const theme = useTheme2();

  const canViewList = canReadTokens;

  // New token modal state
  const [showModal, setShowModal] = useState(false);
  const [newToken, setNewToken] = useState<string | undefined>();

  // Delete confirmation state
  const [tokenToDelete, setTokenToDelete] = useState<TokenInfo | null>(null);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useTokens(
    PAGE_SIZE,
    canViewList
  );

  const createToken = useCreateToken({
    onSuccess: (token) => {
      setNewToken(token);
      setShowModal(true);
    },
  });

  const deleteToken = useDeleteToken();

  const tokens = data?.pages.flatMap((page) => page.items) ?? [];
  // total_count is recomputed on every page, so read it from the latest one.
  const totalCount = data?.pages[data.pages.length - 1]?.total_count ?? 0;
  const currentTokenId = data?.pages[0]?.current_token_id ?? '';
  // current_token_id is only omitted for requests not bound to a token, which
  // should be impossible through the plugin. Fail closed rather than allow
  // revoking the token the plugin itself depends on.
  const currentTokenUnknown = currentTokenId === '';

  const columns: Array<TableColumn<TokenInfo>> = [
    {
      name: 'ID',
      selector: (row) => row.id,
      style: { fontFamily: theme.typography.fontFamilyMonospace },
    },
    {
      name: 'Created',
      selector: (row) => formatUnixSeconds(row.created),
    },
    {
      name: 'Last used',
      cell: (row) =>
        row.lastUsed === 0 ? (
          'Never'
        ) : (
          <Tooltip content={formatUnixSeconds(row.lastUsed)}>
            <span>{dateTimeFormatTimeAgo(row.lastUsed * 1000)}</span>
          </Tooltip>
        ),
    },
  ];

  if (canDeleteTokens) {
    columns.push({
      name: '',
      right: true,
      cell: (row) => {
        const isCurrent = !currentTokenUnknown && row.id === currentTokenId;
        const disabledReason = isCurrent
          ? 'You cannot revoke the token currently in use.'
          : currentTokenUnknown
            ? 'Revoking is unavailable because the current token could not be identified.'
            : undefined;

        const revokeButton = (
          <Button
            variant="destructive"
            size="sm"
            disabled={Boolean(disabledReason) || deleteToken.isPending}
            onClick={() => !disabledReason && setTokenToDelete(row)}
          >
            Revoke
          </Button>
        );

        return disabledReason ? (
          <Tooltip content={disabledReason}>
            <span>{revokeButton}</span>
          </Tooltip>
        ) : (
          revokeButton
        );
      },
    });
  }

  return (
    <ConfigContent title="Access tokens">
      {!canViewList && (
        <ContactAdminAlert
          title="Contact your administrator to generate Access Tokens"
          missingPermissions={[
            'grafana-synthetic-monitoring-app.access-tokens:read',
            'grafana-synthetic-monitoring-app.access-tokens:write',
          ]}
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
          disabled={!canWriteTokens || createToken.isPending}
          onClick={() => createToken.mutate()}
        >
          Generate access token
        </Button>
      </ConfigContent.Section>

      {canViewList && (
        <ConfigContent.Section title="Existing tokens">
          {isLoading && <Spinner />}
          {isError && (
            <Alert severity="error" title="Failed to load access tokens">
              Refresh the page to try again.
            </Alert>
          )}
          {!isLoading && !isError && (
            <>
              <Table<TokenInfo>
                id="access-tokens-list"
                name="access-tokens-list"
                data={tokens}
                columns={columns}
                noDataText="No tokens found."
                pagination={false}
                pointerOnHover={false}
              />

              {hasNextPage && (
                <>
                  <Space v={2} />
                  <Button variant="secondary" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                    {isFetchingNextPage ? (
                      <Spinner />
                    ) : (
                      `Load more (${Math.max(totalCount - tokens.length, 0)} remaining)`
                    )}
                  </Button>
                </>
              )}
            </>
          )}
        </ConfigContent.Section>
      )}

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
        body={`Revoke the token created on ${tokenToDelete ? formatUnixSeconds(tokenToDelete.created) : ''}? This action cannot be undone.`}
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

// Renders in the user's configured timezone, unlike Date.toISOString (UTC).
function formatUnixSeconds(seconds: number): string {
  if (seconds === 0) {
    return 'Never';
  }

  return dateTimeFormat(seconds * 1000);
}
