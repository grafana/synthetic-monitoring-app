import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, IconButton, LinkButton, Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { FORM_SECTION_QUERY_PARAM } from 'components/Checkster/constants';
import { FormSectionName } from 'components/Checkster/types';
import { Feedback } from 'components/Feedback';

import {
  CONNECTED_SERVICES_SUBTITLE,
  CONNECTED_SERVICES_TEST_ID,
  CONNECTED_SERVICES_TITLE,
} from './ConnectedServices.constants';
import { getCheckGraphUrl } from './ConnectedServices.utils';
import { ConnectedServicesMiniGraph, ExposedMiniGraphComponent, useExposedMiniGraph } from './ConnectedServicesMiniGraph';
import {
  findLabelValue,
  getSyntheticCheckEntityName,
  KG_PLUGIN_ID,
  KG_SERVICE_NAME_LABEL,
} from './knowledgeGraph';
import { useKnowledgeGraphEnabled } from './knowledgeGraph.hooks';

interface ConnectedServicesProps {
  check: Check;
}

/**
 * Renders the check's Knowledge Graph service neighbourhood as an inline dashboard section (the
 * check, the Service linked via MONITORED_BY, and that Service's one-hop CALLS neighbours in both
 * directions), drawn by the KG's exposed mini graph component — the KG owns fetching, the ranked
 * layout anchored on the check, insight rings, the node card, and loading/error/empty states, so
 * the section stays visually consistent with the KG by construction.
 *
 * Gating:
 * - KG app not installed or feature flag off → renders nothing (SM works without the Knowledge Graph).
 * - Asserts app predating the mini-graph exposure → renders nothing (the component is the only renderer).
 * - Enabled but the check has no service link → an inviting zero state pointing at the edit form.
 * - Enabled and linked → the exposed mini graph.
 */
export function ConnectedServices({ check }: ConnectedServicesProps) {
  const kgEnabled = useKnowledgeGraphEnabled();
  const { component: MiniGraph, isLoading } = useExposedMiniGraph();

  if (!kgEnabled || isLoading || !MiniGraph) {
    return null;
  }

  return <ConnectedServicesSection check={check} MiniGraph={MiniGraph} />;
}

interface ConnectedServicesSectionProps {
  check: Check;
  MiniGraph: ExposedMiniGraphComponent;
}

function ConnectedServicesSection({ check, MiniGraph }: ConnectedServicesSectionProps) {
  const styles = useStyles2(getStyles);
  // Expanded on load: the graph is the point of the section, and the KG query only runs for a
  // check that is actually linked to a service.
  const [isOpen, setIsOpen] = useState(true);

  const serviceName = findLabelValue(check.labels ?? [], KG_SERVICE_NAME_LABEL);

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
        <Feedback feature="knowledge-graph-connected-services" about={{ text: `New feature!` }} />
        {serviceName && (
          <LinkButton
            variant="secondary"
            size="sm"
            icon="external-link-alt"
            href={getCheckGraphUrl(getSyntheticCheckEntityName(check))}
            target="_blank"
          >
            Open in Knowledge Graph
          </LinkButton>
        )}
      </div>

      {isOpen && (
        <div className={styles.body}>
          {serviceName ? (
            <ConnectedServicesMiniGraph check={check} MiniGraph={MiniGraph} />
          ) : (
            <ConnectedServicesZeroState checkId={check.id} />
          )}
        </div>
      )}
    </section>
  );
}

interface ConnectedServicesZeroStateProps {
  checkId: Check['id'];
}

/** Inviting CTA for a check without a Knowledge Graph service link. */
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
  zeroState: css({
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4, 2),
    maxWidth: '480px',
    margin: '0 auto',
  }),
});
