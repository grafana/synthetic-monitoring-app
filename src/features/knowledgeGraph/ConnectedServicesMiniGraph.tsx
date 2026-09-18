import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Drawer, LinkButton, Stack, ToolbarButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';

import { CONNECTED_SERVICES_TEST_ID, CONNECTED_SERVICES_SUBTITLE, CONNECTED_SERVICES_TITLE } from './ConnectedServices.constants';
import { ConnectedServicesZeroState, ServiceNeighbourhoodGraph } from './ConnectedServices';
import { getCheckGraphUrl } from './ConnectedServices.utils';
import { findLabelValue, getSyntheticCheckEntityName, KG_SERVICE_NAME_LABEL } from './knowledgeGraph';
import { useKnowledgeGraphEnabled } from './knowledgeGraph.hooks';

interface ConnectedServicesMiniGraphProps {
  check: Check;
}

/**
 * A "Mini graph" toolbar button next to the check's Knowledge Graph insights, opening the
 * check's service neighbourhood in a tall side drawer — the same shape as the KG workbench's
 * minigraph panel. A ranked (dagre) graph wants vertical space; the wide, short inline section
 * miniaturizes it, while the drawer gives it a full column on demand.
 */
export function ConnectedServicesMiniGraph({ check }: ConnectedServicesMiniGraphProps) {
  const kgEnabled = useKnowledgeGraphEnabled();
  const styles = useStyles2(getStyles);
  const [open, setOpen] = useState(false);

  if (!kgEnabled) {
    return null;
  }

  const serviceName = findLabelValue(check.labels ?? [], KG_SERVICE_NAME_LABEL);

  return (
    <>
      <ToolbarButton
        icon="sitemap"
        onClick={() => setOpen(true)}
        data-testid={CONNECTED_SERVICES_TEST_ID.miniGraphButton}
      >
        Mini graph
      </ToolbarButton>
      {open && (
        <Drawer title={CONNECTED_SERVICES_TITLE} subtitle={CONNECTED_SERVICES_SUBTITLE} size="md" onClose={() => setOpen(false)}>
          <div className={styles.drawerBody} data-testid={CONNECTED_SERVICES_TEST_ID.miniGraphDrawer}>
            <Stack direction="column" gap={1} height="100%">
              {serviceName && (
                <div>
                  <LinkButton
                    variant="secondary"
                    size="sm"
                    icon="external-link-alt"
                    href={getCheckGraphUrl(getSyntheticCheckEntityName(check))}
                    target="_blank"
                  >
                    Open in Knowledge Graph
                  </LinkButton>
                </div>
              )}
              <div className={styles.graph}>
                {serviceName ? (
                  <ServiceNeighbourhoodGraph check={check} height="100%" />
                ) : (
                  <ConnectedServicesZeroState checkId={check.id} />
                )}
              </div>
            </Stack>
          </div>
        </Drawer>
      )}
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  drawerBody: css({
    height: '100%',
  }),
  graph: css({
    flex: 1,
    minHeight: 0,
    // The exposed graph and the fallback SVG both center themselves; give them the column.
    height: '100%',
  }),
});
