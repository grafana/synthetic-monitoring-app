import React, { useMemo, useState } from 'react';
import { GrafanaTheme2, LoadingState } from '@grafana/data';
import { useAppPluginInstalled } from '@grafana/runtime';
import { VizConfigBuilders } from '@grafana/scenes';
import { useDataTransformer, useQueryRunner, VizPanel } from '@grafana/scenes-react';
import {
  LayoutAlgorithm,
  ZoomMode,
} from '@grafana/schema/dist/esm/raw/composable/nodegraph/panelcfg/x/NodeGraphPanelCfg_types.gen';
import { Icon, IconButton, Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { getCheckType } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { useKGDS } from 'hooks/useKGDS';
import { CenteredSpinner } from 'components/CenteredSpinner/CenteredSpinner';
import { FORM_SECTION_QUERY_PARAM } from 'components/Checkster/constants';
import { FormSectionName } from 'components/Checkster/types';
import { ErrorAlert } from 'components/ErrorAlert/ErrorAlert';

import {
  CONNECTED_SERVICES_SUBTITLE,
  CONNECTED_SERVICES_TEST_ID,
  CONNECTED_SERVICES_TITLE,
} from './ConnectedServices.constants';
import {
  buildServiceNeighbourhoodQuery,
  getCheckNodeIcon,
  getServiceEntityUrl,
  graphPresentationTransformation,
} from './ConnectedServices.utils';
import {
  findLabelValue,
  getSyntheticCheckEntityName,
  KG_NAMESPACE_LABEL,
  KG_PLUGIN_ID,
  KG_SERVICE_NAME_LABEL,
} from './knowledgeGraph';

const viz = VizConfigBuilders.nodegraph()
  // The node graph has no "fit to screen" on load, so the layout is what keeps the neighbourhood
  // visible without manual zooming. A layered layout packs the check + service + one-hop
  // callers/dependencies more compactly than the default force layout, and cooperative zoom stops
  // page scrolling from hijacking the graph.
  .setOption('layoutAlgorithm', LayoutAlgorithm.Layered)
  .setOption('zoomMode', ZoomMode.Cooperative)
  .build();
// Since the panel doesn't fit-to-screen on load, give it a generous fixed height so the graph is
// visible without clipping; users pan/zoom for anything larger.
const GRAPH_HEIGHT = 560;

interface ConnectedServicesProps {
  check: Check;
}

/**
 * Renders the check's Knowledge Graph service neighbourhood as an inline dashboard section (the
 * check, the Service linked via MONITORED_BY, and that Service's one-hop CALLS neighbours in both directions).
 * The node graph carries health arcs and insight counts, so red-ringed neighbours surface as RCA
 * hints without leaving the dashboard.
 *
 * Gating:
 * - KG app not installed → renders nothing (SM works without the Knowledge Graph).
 * - Installed but the check has no service link → an inviting zero state pointing at the edit form.
 * - Installed and linked → the node graph, with loading/error states from the query runner.
 */
export function ConnectedServices({ check }: ConnectedServicesProps) {
  const { value: kgInstalled } = useAppPluginInstalled(KG_PLUGIN_ID);

  if (!kgInstalled) {
    return null;
  }

  return <ConnectedServicesSection check={check} />;
}

function ConnectedServicesSection({ check }: ConnectedServicesProps) {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(false);

  const serviceName = findLabelValue(check.labels ?? [], KG_SERVICE_NAME_LABEL);
  const namespace = findLabelValue(check.labels ?? [], KG_NAMESPACE_LABEL);

  return (
    <section className={styles.container} data-testid={CONNECTED_SERVICES_TEST_ID.section}>
      <div className={styles.header}>
        <IconButton
          name={isOpen ? 'angle-down' : 'angle-right'}
          aria-label={isOpen ? 'Collapse connected services' : 'Expand connected services'}
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
          {serviceName ? (
            <ServiceNeighbourhoodGraph check={check} serviceName={serviceName} />
          ) : (
            <ConnectedServicesZeroState checkId={check.id} />
          )}
        </div>
      )}
    </section>
  );
}

interface ServiceNeighbourhoodGraphProps {
  check: Check;
  serviceName: string;
}

function ServiceNeighbourhoodGraph({ check, serviceName }: ServiceNeighbourhoodGraphProps) {
  const styles = useStyles2(getStyles);
  const kgDS = useKGDS();

  const cypherQuery = buildServiceNeighbourhoodQuery(getSyntheticCheckEntityName(check));

  const dataProvider = useQueryRunner({
    datasource: kgDS ? { uid: kgDS.uid, type: kgDS.type } : undefined,
    queries: [
      {
        refId: 'A',
        queryType: 'entityGraph',
        queryMode: 'cypher',
        cypherQuery,
      },
    ],
  });

  // Give the originating check node its check-type icon and strip the zero-value stat labels.
  const nodeIcon = getCheckNodeIcon(getCheckType(check.settings));
  const transformations = useMemo(() => [graphPresentationTransformation(nodeIcon)], [nodeIcon]);
  const graphData = useDataTransformer({ transformations, data: dataProvider });

  const { data } = graphData.useState();
  const state = data?.state;

  if (state === LoadingState.Error) {
    return (
      <div data-testid={CONNECTED_SERVICES_TEST_ID.error}>
        <ErrorAlert
          title="Couldn't load the service graph."
          content="The Knowledge Graph datasource didn't respond. Check its status and try again."
          buttonText="Retry"
          onClick={() => dataProvider.runQueries()}
        />
      </div>
    );
  }

  return (
    <div className={styles.graph} data-testid={CONNECTED_SERVICES_TEST_ID.graph}>
      {state === LoadingState.Loading ? (
        <div className={styles.loading} data-testid={CONNECTED_SERVICES_TEST_ID.loading}>
          <CenteredSpinner aria-label="Loading connected services" />
        </div>
      ) : (
        <VizPanel title="" dataProvider={graphData} viz={viz} hoverHeader />
      )}
    </div>
  );
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
  graph: css({
    height: GRAPH_HEIGHT,
  }),
  loading: css({
    height: '100%',
  }),
  zeroState: css({
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4, 2),
    maxWidth: '480px',
    margin: '0 auto',
  }),
});
