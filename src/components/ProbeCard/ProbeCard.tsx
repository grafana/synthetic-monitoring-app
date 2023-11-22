import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Button, styleMixins, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { type Label, type Probe, ROUTES } from 'types';
import { canEditProbes } from 'utils';
import { SuccessRateTypes } from 'contexts/SuccessRateContext';
import { getRoute } from 'components/Routing';
import { SuccessRateGauge } from 'components/SuccessRateGauge';

export const ProbeCard = ({ probe }: { probe: Probe }) => {
  const [isFocused, setIsFocused] = useState(false);
  const onlineTxt = probe.online ? 'Online' : 'Offline';
  const onlineIcon = probe.online ? 'heart' : 'heart-break';
  const color = probe.online ? 'green' : 'red';
  const probeTypeText = probe.public ? 'Public' : 'Private';
  const probeTypeIcon = probe.public ? 'cloud' : 'lock';
  const styles = useStyles2(getStyles);
  const href = `${getRoute(ROUTES.EditProbe)}/${probe.id}`;
  const labelsString = labelsToString(probe.labels);
  const canEdit = canEditProbes(probe);

  return (
    <div className={styles.cardWrapper}>
      <div className={styles.card}>
        <div>
          <Link className={styles.link} to={href} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}>
            <h3 className="h5">{probe.name}</h3>
          </Link>
          <div className={styles.info}>
            <div className={styles.badges}>
              <Badge color={color} icon={onlineIcon} text={onlineTxt} />
              <Badge color="blue" icon="compass" text={probe.region} />
              <Badge color="blue" icon={probeTypeIcon} text={probeTypeText} />
            </div>
            <div className={styles.meta}>
              {labelsString && <div>Labels: {labelsString}</div>}
              <div>Version: {probe.version}</div>
            </div>
          </div>
        </div>
        <div className={styles.gaugeContainer}>
          <SuccessRateGauge
            title="Reachability"
            type={SuccessRateTypes.Probes}
            id={probe.id!}
            height={60}
            width={150}
          />
        </div>
        <div className={styles.buttonWrapper}>
          <Button aria-hidden className={cx(styles.button, { [styles.focussed]: isFocused })} tabIndex={-1}>
            {canEdit ? `Edit` : `View`}
          </Button>
        </div>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const containerName = `probeCard`;
  const breakpoint = theme.breakpoints.values.sm;
  const containerQuery = `@container ${containerName} (max-width: ${breakpoint}px)`;
  const mediaQuery = `@supports not (container-type: inline-size) @media (max-width: ${breakpoint}px)`;

  return {
    cardWrapper: css({
      containerName,
      containerType: `inline-size`,
    }),
    card: css({
      display: `grid`,
      gridTemplateColumns: `auto 1fr auto`,
      gridTemplateAreas: `"info gauge action"`,
      padding: theme.spacing(2),
      background: theme.colors.background.secondary,
      borderRadius: theme.shape.radius.default,
      position: `relative`,
      marginBottom: theme.spacing(1),

      [containerQuery]: {
        gridTemplateAreas: `
        "info action"
        "gauge action"
        `,
        gridTemplateColumns: `1fr auto`,
      },

      [mediaQuery]: {
        gridTemplateAreas: `
        "info action"
        "gauge action"
        `,
        gridTemplateColumns: `1fr auto`,
      },

      '&:hover button': {
        opacity: 1,
      },

      '&:hover': {
        background: theme.colors.emphasize(theme.colors.background.secondary, 0.03),
        cursor: 'pointer',
        zIndex: 1,
      },
    }),
    info: css({
      display: `flex`,
      gap: theme.spacing(0.5),
      flexDirection: `column`,
      gridArea: `info`,
    }),
    badges: css({
      display: `flex`,
      gap: theme.spacing(0.5),
    }),
    meta: css({
      color: theme.colors.text.secondary,
    }),
    gaugeContainer: css({
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gridArea: `gauge`,

      [containerQuery]: {
        justifyContent: 'flex-start',
        marginLeft: theme.spacing(-1),
        marginTop: theme.spacing(1),
      },

      [mediaQuery]: {
        justifyContent: 'flex-start',
        marginLeft: theme.spacing(-1),
        marginTop: theme.spacing(1),
      },
    }),
    link: css({
      marginBottom: theme.spacing(1),
      display: `block`,

      all: 'unset',
      '&::after': {
        position: 'absolute',
        content: '""',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: theme.shape.radius.default,
      },

      '&:focus-visible': {
        outline: 'none',
        outlineOffset: 0,
        boxShadow: 'none',

        '&::after': {
          ...styleMixins.getFocusStyles(theme),
          zIndex: 1,
        },
      },
    }),
    buttonWrapper: css({
      alignItems: 'center',
      display: 'flex',
      gap: theme.spacing(2),
      gridArea: `action`,
    }),
    button: css({
      opacity: 0,

      [containerQuery]: {
        opacity: 1,
      },

      [mediaQuery]: {
        opacity: 1,
      },
    }),
    focussed: css({
      opacity: 1,
    }),
  };
};

function labelsToString(labels: Label[]) {
  return labels.map(({ name, value }) => `${name}:${value}`).join(', ');
}
