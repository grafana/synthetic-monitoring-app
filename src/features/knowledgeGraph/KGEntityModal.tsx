import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Modal, Spinner, Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, KGEntity } from 'types';

import { buildKGEntityGraphUrl } from './knowledgeGraph';
import { useKnowledgeGraphEntity } from './useKnowledgeGraphEntity';

function severityBadgeColor(severity: string): 'red' | 'orange' | 'blue' | 'green' {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'red';
    case 'warning':
      return 'orange';
    case 'info':
      return 'blue';
    default:
      return 'green';
  }
}

function ServiceHealthSection({ entity, styles }: { entity: KGEntity; styles: ReturnType<typeof getStyles> }) {
  const severity = entity.assertion?.severity;
  const assertions = entity.assertion?.assertions ?? [];

  return (
    <div>
      <Stack direction="row" gap={1} alignItems="center" justifyContent="space-between">
        <Text variant="h5">{entity.name}</Text>
        {severity ? (
          <Badge text={severity} color={severityBadgeColor(severity)} />
        ) : (
          <Badge text="No active alerts" color="green" />
        )}
      </Stack>

      {assertions.length > 0 && (
        <div className={styles.section}>
          <Text variant="bodySmall" weight="bold" color="secondary">Active alerts</Text>
          <Stack direction="column" gap={0.5}>
            {assertions.map((a) => (
              <Stack key={a.assertionName} direction="row" gap={1} alignItems="center">
                <Badge text={a.severity} color={severityBadgeColor(a.severity)} />
                <Text variant="bodySmall">{a.assertionName}</Text>
                <Text variant="bodySmall" color="secondary">({a.category})</Text>
              </Stack>
            ))}
          </Stack>
        </div>
      )}
    </div>
  );
}

function ConnectionsSection({ entity, styles }: { entity: KGEntity; styles: ReturnType<typeof getStyles> }) {
  const connected = entity.connectedEntityTypes;
  if (!connected || Object.keys(connected).length === 0) {
    return null;
  }

  const entries = Object.entries(connected).filter(([, count]) => count > 0);
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className={styles.section}>
      <Text variant="bodySmall" weight="bold" color="secondary">Connections</Text>
      <table className={styles.table}>
        <tbody>
          {entries.map(([type, count]) => (
            <tr key={type}>
              <td className={styles.labelCell}>
                <Text variant="bodySmall">{type}</Text>
              </td>
              <td className={styles.valueCell}>
                <Text variant="bodySmall">{count} {type.toLowerCase()}{count !== 1 ? 's' : ''}</Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SHOW_PROPERTIES = ['otel_service', 'service_version', 'telemetry_sdk_language', 'otel_namespace', 'job'];

function ServiceDetailsSection({ entity, styles }: { entity: KGEntity; styles: ReturnType<typeof getStyles> }) {
  const properties = SHOW_PROPERTIES
    .filter((key) => entity.properties[key] != null)
    .map((key) => [key, entity.properties[key]] as const);

  if (properties.length === 0) {
    return null;
  }

  return (
    <div className={styles.section}>
      <Text variant="bodySmall" weight="bold" color="secondary">Service details</Text>
      <table className={styles.table}>
        <tbody>
          {properties.map(([key, value]) => (
            <tr key={key}>
              <td className={styles.labelCell}>
                <Text variant="bodySmall" color="secondary">{key}</Text>
              </td>
              <td className={styles.valueCell}>
                <Text variant="bodySmall">{String(value)}</Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface KGEntityModalProps {
  check: Check;
  onDismiss: () => void;
}

export function KGEntityModal({ check, onDismiss }: KGEntityModalProps) {
  const data = useKnowledgeGraphEntity(check);
  const styles = useStyles2(getStyles);
  const serviceEntity = data?.serviceEntity;

  return (
    <Modal title="Knowledge Graph Context" isOpen onDismiss={onDismiss}>
      {data?.isLoading ? (
        <Stack direction="row" gap={1} alignItems="center">
          <Spinner size="sm" />
          <Text color="secondary">Loading entity data...</Text>
        </Stack>
      ) : (
        <Stack direction="column" gap={2}>
          {serviceEntity ? (
            <>
              <Text color="secondary">
                This check monitors the <strong>{serviceEntity.name}</strong> service
              </Text>

              <ServiceHealthSection entity={serviceEntity} styles={styles} />
              <ConnectionsSection entity={serviceEntity} styles={styles} />
              <ServiceDetailsSection entity={serviceEntity} styles={styles} />
            </>
          ) : data?.checkEntity ? (
            <>
              <Text color="secondary">
                This check exists in the Knowledge Graph but is not linked to a service.
                Add a <strong>service_name</strong> label to see service health and connections.
              </Text>
              <ConnectionsSection entity={data.checkEntity} styles={styles} />
            </>
          ) : (
            <Text color="secondary">
              Entity data not available. The check may not have been discovered by the Knowledge Graph yet.
            </Text>
          )}

          <TextLink href={buildKGEntityGraphUrl(check)} external icon="external-link-alt">
            View in Knowledge Graph
          </TextLink>
        </Stack>
      )}
    </Modal>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  section: css({
    marginTop: theme.spacing(1),
  }),
  table: css({
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: theme.spacing(0.5),
  }),
  labelCell: css({
    padding: theme.spacing(0.5, 1),
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    verticalAlign: 'top',
    whiteSpace: 'nowrap',
  }),
  valueCell: css({
    padding: theme.spacing(0.5, 1),
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    verticalAlign: 'top',
    wordBreak: 'break-word',
  }),
});
