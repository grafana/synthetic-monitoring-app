import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackSLOLinkClick } from 'features/tracking/sloIntegrationEvents';

import { Toggletip } from 'components/Toggletip';
import { buildSLODashboardHref, buildSLOEditHref } from 'scenes/Common/grafanaSLOApp.constants';
import type { SLO } from 'scenes/Common/grafanaSLOApp.types';
import { SLOIcon } from 'scenes/Common/SLOIcon';

interface SLOStatusProps {
  slos: SLO[];
}

export const SLOStatus = ({ slos }: SLOStatusProps) => {
  const styles = useStyles2(getStyles);

  if (slos.length === 0) {
    return null;
  }

  const ariaLabel = slos.length === 1 ? 'Linked to 1 SLO' : `Linked to ${slos.length} SLOs`;

  return (
    <Toggletip content={<SLOStatusTooltip slos={slos} />}>
      <button type="button" aria-label={ariaLabel} className={styles.button}>
        <SLOIcon pixelSize={14} />
      </button>
    </Toggletip>
  );
};

const SLOStatusTooltip = ({ slos }: { slos: SLO[] }) => {
  return (
    <Stack direction="column" gap={1}>
      <Text weight="medium">{slos.length === 1 ? 'Linked SLO' : `Linked SLOs (${slos.length})`}</Text>
      <Stack direction="column" gap={0.5}>
        {slos.map((slo) => {
          const href = buildSLODashboardHref(slo) ?? buildSLOEditHref(slo.uuid);
          return (
            <TextLink
              key={slo.uuid}
              href={href}
              variant="bodySmall"
              onClick={() => trackSLOLinkClick(href, 'check_list_slo_status')}
            >
              {slo.name}
            </TextLink>
          );
        })}
      </Stack>
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  button: css({
    background: 'transparent',
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.pill,
    padding: theme.spacing(0.5),
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: `background-color 0.2s ease`,

    '&:hover': {
      background: theme.colors.secondary.transparent,
    },
  }),
});
