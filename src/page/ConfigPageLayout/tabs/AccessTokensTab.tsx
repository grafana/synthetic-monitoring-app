import React, { useState } from 'react';
import { Button, ConfirmModal, EmptyState, Modal, Spinner, Space, TextLink } from '@grafana/ui';

import { getUserPermissions } from 'data/permissions';
import { useCreateToken, useDeleteToken, useTokens } from 'data/useTokens';
import { Clipboard } from 'components/Clipboard';
import { ContactAdminAlert } from 'page/ContactAdminAlert';
import { formatDate } from 'utils';
import type { TokenInfo } from 'datasource/responses.types';

import { ConfigContent } from '../ConfigContent';

const PAGE_SIZE = 50;

/** Formats a nanosecond Unix timestamp for display. */
function formatNano(ns: number): string {
  return ns > 0 ? formatDate(ns / 1e6) : 'Never';
}

export function AccessTokensTab() {
  const { canReadTokens, canWriteTokens, canDeleteTokens } = getUserPermissions();

  // In Iteration 1, write permission implies read — the list is always shown to
  // users who can write tokens, even if the explicit :read permission is absent
  // from their session (e.g. before the plugin.json update has been picked up).
  const canViewList = canReadTokens || canWriteTokens;

  // Pagination state — simple "load more" for Iteration 1
  const [offset, setOffset] = useState(0);
  const [allTokens, setAllTokens] = useState<TokenInfo[]>([]);

  // New token modal state
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [newToken, setNewToken] = useState<string | undefined>();

  // Delete confirmation state
  const [tokenToDelete, setTokenToDelete] = useState<TokenInfo | undefined>();

  const { data, isLoading, isFetching } = useTokens(PAGE_SIZE, offset, canViewList);

  // Merge newly fetched pages into allTokens
  React.useEffect(() => {
    if (data?.tokens) {
      if (offset === 0) {
        setAllTokens(data.tokens);
      } else {
        setAllTokens((prev) => [...prev, ...data.tokens]);
      }
    }
  }, [data, offset]);

  const createToken = useCreateToken({
    onSuccess: (token) => {
      setNewToken(token);
      setShowTokenModal(true);
    },
  });

  const deleteToken = useDeleteToken({
    onSuccess: () => {
      // Reset to first page so the list refreshes from the top
      setOffset(0);
    },
  });

  const totalCount = data?.totalCount ?? 0;
  const hasMore = allTokens.length < totalCount;

  const handleLoadMore = () => {
    const nextOffset = allTokens.length;
    setOffset(nextOffset);
  };

  const handleDeleteConfirm = () => {
    if (tokenToDelete) {
      deleteToken.mutate(tokenToDelete.id);
    }
    setTokenToDelete(undefined);
  };

  if (isLoading && canViewList) {
    return <ConfigContent loading ariaLoadingLabel="Loading access tokens" />;
  }

  return (
    <>
      {!canViewList ? (
        <ConfigContent title="Access tokens">
          <ContactAdminAlert
            title="Contact your administrator to manage Access Tokens"
            missingPermissions={['grafana-synthetic-monitoring-app.access-tokens:write']}
          />
        </ConfigContent>
      ) : canViewList && allTokens.length === 0 && !isLoading ? (
        <ConfigContent>
          <EmptyState
            variant="call-to-action"
            message="No access tokens yet."
            button={
              canWriteTokens ? (
                <Button
                  icon="plus"
                  onClick={() => createToken.mutate()}
                  disabled={createToken.isPending}
                >
                  Generate access token
                </Button>
              ) : undefined
            }
          >
            Access tokens are used to authenticate with the Synthetic Monitoring API.
          </EmptyState>
        </ConfigContent>
      ) : (
        <ConfigContent
          title="Access tokens"
          actions={
            canWriteTokens ? (
              <Button
                size="sm"
                icon="plus"
                onClick={() => createToken.mutate()}
                disabled={createToken.isPending}
                tooltip={!canWriteTokens ? 'You do not have permission to generate access tokens.' : undefined}
              >
                Generate access token
              </Button>
            ) : undefined
          }
        >
          <ConfigContent.Section title="Synthetic Monitoring">
            You can use an SM access token to authenticate with the synthetic monitoring API. Check out the{' '}
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
            documentation to learn more.
          </ConfigContent.Section>

          {canViewList && allTokens.length > 0 && (
            <ConfigContent.Section title="Your tokens">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #444' }}>ID</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #444' }}>Created</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #444' }}>Last used</th>
                    {canDeleteTokens && (
                      <th style={{ textAlign: 'right', padding: '8px 4px', borderBottom: '1px solid #444' }}></th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {allTokens.map((token) => (
                    <tr key={token.id}>
                      <td style={{ padding: '8px 4px' }}>{token.id}</td>
                      <td style={{ padding: '8px 4px' }}>{formatNano(token.created)}</td>
                      <td style={{ padding: '8px 4px' }}>{formatNano(token.lastUsed)}</td>
                      {canDeleteTokens && (
                        <td style={{ textAlign: 'right', padding: '8px 4px' }}>
                          <Button
                            size="sm"
                            variant="destructive"
                            fill="outline"
                            onClick={() => setTokenToDelete(token)}
                            disabled={deleteToken.isPending}
                          >
                            Delete
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {hasMore && (
                <>
                  <Space v={2} />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={isFetching}
                    icon={isFetching ? undefined : 'angle-down'}
                  >
                    {isFetching ? <Spinner /> : `Load more (${totalCount - allTokens.length} remaining)`}
                  </Button>
                </>
              )}
            </ConfigContent.Section>
          )}

          <ConfigContent.Section title="Private probes">
            Each private probe has its own access token. You will only ever see the access token when you first create
            the private probe, and if you &quot;Reset access token&quot; for an already created probe.
          </ConfigContent.Section>
        </ConfigContent>
      )}

      {/* New token display modal */}
      <Modal title="Access Token" isOpen={showTokenModal} onDismiss={() => setShowTokenModal(false)}>
        <>
          <p>Copy your access token now. You will not be able to see it again.</p>
          {newToken && <Clipboard content={newToken} />}
        </>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={!!tokenToDelete}
        title="Delete access token"
        body={
          <div>
            Are you sure you want to delete token <strong>#{tokenToDelete?.id}</strong>? Any clients using this token
            will immediately lose access.
          </div>
        }
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onDismiss={() => setTokenToDelete(undefined)}
      />
    </>
  );
}
