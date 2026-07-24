import React, { Fragment, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Text, useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckHeaderDefinitionModel, CheckHeaderMetaItem, CheckHeaderStatus } from './CheckDashboardHeader.types';

export function CheckIdentitySummary({
  model,
  status,
  meta,
  actions,
}: {
  model: CheckHeaderDefinitionModel;
  status?: CheckHeaderStatus;
  meta?: CheckHeaderMetaItem[];
  actions?: ReactNode;
}) {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const methodColor = model.qualifier?.getColor?.(theme);
  const hasMeta = Boolean(meta && meta.length > 0);

  return (
    <section aria-label="Check identity" className={styles.container}>
      <div className={styles.titleRow}>
        <div className={styles.identityGroup}>
          <div className={styles.identityText}>
            <div className={styles.nameRow}>
              <Text element="h1" variant="h1">
                {model.title}
              </Text>
              {status ? (
                <span
                  className={cx(styles.status, status.running ? styles.statusRunning : styles.statusPaused)}
                  data-testid="check-identity-status"
                >
                  <span className={styles.statusPip} />
                  {status.label}
                </span>
              ) : null}
            </div>
            {model.target ? (
              <div
                aria-label={model.target.accessibleLabel}
                className={styles.target}
                data-testid="check-identity-metadata"
                title={model.target.value}
              >
                {model.qualifier ? (
                  <span className={styles.qualifier} style={methodColor ? { color: methodColor } : undefined}>
                    {model.qualifier.text}
                  </span>
                ) : null}
                <span className={styles.targetValue}>{model.target.value}</span>
              </div>
            ) : null}
          </div>
        </div>
        {hasMeta || actions ? (
          <div className={styles.rightCluster}>
            {hasMeta ? (
              <dl aria-label="Check metadata" className={styles.metaList} data-testid="check-identity-meta">
                {meta!.map((item) => (
                  <Fragment key={item.id}>
                    <dt className={styles.metaLabel}>
                      {item.icon ? <Icon aria-hidden className={styles.metaIcon} name={item.icon} size="xs" /> : null}
                      {item.label}
                    </dt>
                    <dd className={styles.metaValue} title={item.title}>
                      {item.value}
                    </dd>
                  </Fragment>
                ))}
              </dl>
            ) : null}
            {actions ? <div className={styles.actions}>{actions}</div> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({ display: 'flex', flexDirection: 'column', minWidth: 0 }),
  titleRow: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'space-between',
    minWidth: 0,
  }),
  identityGroup: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
    minWidth: 0,
  }),
  identityText: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.25),
    minWidth: 0,
  }),
  nameRow: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1.5),
    minWidth: 0,
  }),
  status: css({
    alignItems: 'center',
    borderRadius: theme.shape.radius.pill,
    display: 'inline-flex',
    flexShrink: 0,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightBold,
    gap: theme.spacing(0.75),
    lineHeight: 1,
    padding: theme.spacing(0.5, 1),
    whiteSpace: 'nowrap',
  }),
  statusRunning: css({
    background: theme.colors.success.transparent,
    color: theme.colors.success.text,
  }),
  statusPaused: css({
    background: theme.colors.warning.transparent,
    color: theme.colors.warning.text,
  }),
  statusPip: css({
    background: 'currentColor',
    borderRadius: '50%',
    height: 7,
    width: 7,
  }),
  rightCluster: css({
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    gap: theme.spacing(2),
  }),
  metaList: css({
    columnGap: theme.spacing(1),
    display: 'grid',
    gridTemplateColumns: 'auto auto',
    margin: 0,
    rowGap: theme.spacing(0.25),
  }),
  metaLabel: css({
    alignItems: 'center',
    color: theme.colors.text.secondary,
    display: 'inline-flex',
    fontSize: theme.typography.bodySmall.fontSize,
    gap: theme.spacing(0.5),
    whiteSpace: 'nowrap',
  }),
  metaIcon: css({
    color: theme.colors.text.secondary,
  }),
  metaValue: css({
    color: theme.colors.text.primary,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    margin: 0,
    textAlign: 'right',
    whiteSpace: 'nowrap',
  }),
  actions: css({ flexShrink: 0 }),
  target: css({
    alignItems: 'baseline',
    color: theme.colors.text.secondary,
    display: 'flex',
    flex: '0 1 auto',
    fontSize: theme.typography.bodySmall.fontSize,
    fontFamily: theme.typography.fontFamilyMonospace,
    gap: theme.spacing(1),
    maxWidth: 'min(100%, 520px)',
    minWidth: 0,
  }),
  qualifier: css({
    flexShrink: 0,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  targetValue: css({
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
});
