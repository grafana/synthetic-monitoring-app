import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, IconButton, Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { CenteredSpinner } from 'components/CenteredSpinner/CenteredSpinner';
import { FORM_SECTION_QUERY_PARAM } from 'components/Checkster/constants';
import { FormSectionName } from 'components/Checkster/types';
import { ErrorAlert } from 'components/ErrorAlert/ErrorAlert';

import {
  CONNECTED_SERVICES_SUBTITLE,
  CONNECTED_SERVICES_TEST_ID,
  CONNECTED_SERVICES_TITLE,
} from './ConnectedServices.constants';
import { useServiceNeighbourhood } from './ConnectedServices.hooks';
import { getServiceEntityUrl } from './ConnectedServices.utils';
import { ConnectedServicesGraph } from './ConnectedServicesGraph';
import { findLabelValue, KG_NAMESPACE_LABEL, KG_PLUGIN_ID, KG_SERVICE_NAME_LABEL } from './knowledgeGraph';
import { useKnowledgeGraphEnabled } from './knowledgeGraph.hooks';

// Reserve room for the loading state so the section doesn't jump when the graph arrives.
const MIN_BODY_HEIGHT = 280;

interface ConnectedServicesProps {
  check: Check;
}

/**
 * Renders the check's Knowledge Graph service neighbourhood as an inline dashboard section (the
 * check, the Service linked via MONITORED_BY, and that Service's one-hop CALLS neighbours in both directions).
 * The nodes carry the KG's insight rings, so red-ringed neighbours surface as RCA hints without
 * leaving the dashboard.
 *
 * Gating:
 * - KG app not installed or feature flag off → renders nothing (SM works without the Knowledge Graph).
 * - Enabled but the check has no service link → an inviting zero state pointing at the edit form.
 * - Enabled and linked → the neighbourhood graph, with loading/error states from the query.
 */
export function ConnectedServices({ check }: ConnectedServicesProps) {
  const kgEnabled = useKnowledgeGraphEnabled();

  if (!kgEnabled) {
    return null;
  }

  return <ConnectedServicesSection check={check} />;
}

function ConnectedServicesSection({ check }: ConnectedServicesProps) {
  const styles = useStyles2(getStyles);
  // Expanded on load: the graph is the point of the section, and the KG query only runs for a
  // check that is actually linked to a service.
  const [isOpen, setIsOpen] = useState(true);

  const serviceName = findLabelValue(check.labels ?? [], KG_SERVICE_NAME_LABEL);
  const namespace = findLabelValue(check.labels ?? [], KG_NAMESPACE_LABEL);

  return (
    <section className={styles.container} data-testid={CONNECTED_SERVICES_TEST_ID.section}>
      <div className={styles.header}>
        <IconButton
          name={isOpen ? 'angle-down' : 'angle-right'}
          aria-label="Connected services"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        />
        <div className={styles.headerText}>
          <Text element="h2" variant="h5">
            {CONNECTED_SERVICES_TITLE}
          </Text>
          <Text variant="bodySmall" color="secondary">
            {CONNECTED_SERVICES_SUBTITLE}
          </Text>
        </div>
        {serviceName && (
          <TextLink href={getServiceEntityUrl(serviceName, namespace)} external icon="external-link-alt">
            Open in Knowledge Graph
          </TextLink>
        )}
      </div>

      {isOpen && (
        <div className={styles.body}>
          {serviceName ? <ServiceNeighbourhoodGraph check={check} /> : <ConnectedServicesZeroState checkId={check.id} />}
        </div>
      )}
    </section>
  );
}

interface ServiceNeighbourhoodGraphProps {
  check: Check;
}

function ServiceNeighbourhoodGraph({ check }: ServiceNeighbourhoodGraphProps) {
  const styles = useStyles2(getStyles);
  const { data, isLoading, isError, refetch } = useServiceNeighbourhood(check);

  if (isError) {
    return (
      <div data-testid={CONNECTED_SERVICES_TEST_ID.error}>
        <ErrorAlert
          title="Couldn't load the service graph."
          content="The Knowledge Graph datasource didn't respond. Check its status and try again."
          buttonText="Retry"
          onClick={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.loading} data-testid={CONNECTED_SERVICES_TEST_ID.loading}>
        <CenteredSpinner aria-label="Loading connected services" />
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    // The check is linked but the KG hasn't discovered the entities yet (rules sync every few
    // minutes, and the linked service may not exist under that name/namespace).
    return (
      <div className={styles.empty} data-testid={CONNECTED_SERVICES_TEST_ID.empty}>
        <Text variant="body" color="secondary">
          No graph data for this check yet. The Knowledge Graph may still be discovering it — check back in a few
          minutes.
        </Text>
      </div>
    );
  }

  return <ConnectedServicesGraph neighbourhood={data} />;
}

interface ConnectedServicesZeroStateProps {
  checkId: Check['id'];
}

function ConnectedServicesZeroState({ checkId }: ConnectedServicesZeroStateProps) {
  const styles = useStyles2(getStyles);
  // Deep link straight to the Labels section of the edit form, where the KG service link lives.
  const editHref =
    checkId != null
      ? `${generateRoutePath(AppRoutes.EditCheck, { id: checkId })}?${FORM_SECTION_QUERY_PARAM}=${FormSectionName.Labels}`
      : undefined;

  return (
    <div className={styles.zeroState} data-testid={CONNECTED_SERVICES_TEST_ID.zeroState}>
      <Stack direction="column" alignItems="center" gap={1}>
        <Icon name="sitemap" size="xxl" />
        <Text element="h3" variant="h5">
          Connect this check to a service
        </Text>
        <Text variant="body" color="secondary" textAlignment="center">
          Link a Knowledge Graph service to surface connected services and root-cause hints when this check fails.
        </Text>
        <Stack direction="row" alignItems="center" gap={2}>
          {editHref && (
            <TextLink href={editHref} icon="pen">
              Add service link
            </TextLink>
          )}
          <TextLink href={`/a/${KG_PLUGIN_ID}/`} external>
            Learn more
          </TextLink>
        </Stack>
      </Stack>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.primary,
  }),
  header: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 2),
  }),
  headerText: css({
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  }),
  body: css({
    padding: theme.spacing(0, 2, 2, 2),
  }),
  loading: css({
    height: MIN_BODY_HEIGHT,
  }),
  empty: css({
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4, 2),
  }),
  zeroState: css({
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4, 2),
    maxWidth: '480px',
    margin: '0 auto',
  }),
});
