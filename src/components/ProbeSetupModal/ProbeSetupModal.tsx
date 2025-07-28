import React, { useEffect } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Modal, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { FaroEvent, reportEvent } from 'faro';
import { useProbeApiServer } from 'hooks/useProbeApiServer';
import { CopyToClipboard } from 'components/Clipboard/CopyToClipboard';
import { DocsLink } from 'components/DocsLink';
import { Table } from 'components/Table';

type TokenModalProps = {
  actionText: string;
  isOpen: boolean;
  onDismiss: () => void;
  token: string;
};

export const ProbeSetupModal = ({ actionText, isOpen, onDismiss, token }: TokenModalProps) => {
  return (
    <Modal isOpen={isOpen} title="Probe setup" onDismiss={onDismiss}>
      <Stack direction="column" gap={2}>
        <Alert severity="warning" title="Note">
          This is the only time you will see this <code>API_TOKEN</code>. If you need to view it again, you will need to
          reset the token.
        </Alert>
        <EnvsTable token={token} />
        <Stack justifyContent="space-between">
          <DocsLink article="addPrivateProbe">Learn how to run a private probe</DocsLink>
          <Button onClick={onDismiss}>{actionText}</Button>
        </Stack>
      </Stack>
    </Modal>
  );
};

const EnvsTable = ({ token }: { token: string }) => {
  const styles = useStyles2(getStyles);
  const apiServer = useProbeApiServer();

  return (
    <Table
      data={[
        { variable: 'API_TOKEN', value: token },
        { variable: 'API_SERVER', value: apiServer },
      ]}
      columns={[
        {
          name: 'Variable',
          cell: (row) => <code>{row.variable}</code>,
        },
        {
          name: 'Value',
          cell: (row) => {
            if (row.value === undefined) {
              return <NoMappingFound />;
            }

            return <div className={styles.valueCell}>{row.value}</div>;
          },
          grow: 4,
        },
        {
          name: 'Copy',
          cell: (row) =>
            row.value && (
              <CopyToClipboard content={row.value} buttonText="Copy" buttonTextCopied="Copied" fill="text" />
            ),
        },
      ]}
      noDataText="No data"
      pagination={false}
      id="probe-setup-modal-table"
      name="probe-setup-modal-table"
    />
  );
};

const NoMappingFound = () => {
  useEffect(() => {
    reportEvent(FaroEvent.NO_PROBE_MAPPING_FOUND);
  }, []);

  return (
    <div>
      <p>No mapping found</p>
      <p>
        Please contact support to get the correct <code>API_SERVER</code> value.
      </p>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    maxWidth: '100%',
    width: '100%',
  }),
  valueCell: css({
    overflowWrap: 'anywhere',
  }),
});
