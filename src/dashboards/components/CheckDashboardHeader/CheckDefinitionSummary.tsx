import React, { ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckHeaderDefinitionModel, HeaderDefinitionFact } from './CheckDashboardHeader.types';
import { Toggletip } from 'components/Toggletip';

const MAX_INLINE_LABELS = 3;

function DefinitionDetails({ title, items }: { title: string; items: HeaderDefinitionFact[] }) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.toggletipContent}>
      <strong>{title}</strong>
      {items.length > 0 ? (
        <dl className={styles.detailList}>
          {items.map((item) => (
            <React.Fragment key={item.id}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </React.Fragment>
          ))}
        </dl>
      ) : (
        <span>No additional configuration</span>
      )}
    </div>
  );
}

export function CheckDefinitionSummary({
  model,
  actions,
}: {
  model: CheckHeaderDefinitionModel;
  actions?: ReactNode;
}) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const visibleLabels = model.labels.slice(0, MAX_INLINE_LABELS);
  const additionalLabels = model.labels.slice(MAX_INLINE_LABELS);

  return (
    <section aria-label="Check definition" className={styles.container}>
      <div className={styles.titleRow}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{model.title}</h1>
          <span className={styles.compoundBadge}>
            <span className={styles.typeLabel}>{model.typeLabel}</span>
            {model.qualifier ? (
              <span
                className={styles.qualifier}
                style={{ color: model.qualifier.getColor?.(theme) }}
              >
                {model.qualifier.text}
              </span>
            ) : null}
          </span>
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>

      {model.target ? (
        <div aria-label={model.target.accessibleLabel} className={styles.target} title={model.target.value}>
          {model.target.value}
        </div>
      ) : null}

      <div className={styles.definitionRow}>
        <dl className={styles.factList}>
          {model.facts.map((fact) => (
            <div className={styles.fact} key={fact.id}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        {model.labels.length > 0 ? (
          <div aria-label="Labels" className={styles.labels}>
            {visibleLabels.map((label) => (
              <span className={styles.label} key={`${label.name}-${label.value}`}>
                {label.name}: {label.value}
              </span>
            ))}
            {additionalLabels.length > 0 ? (
              <Toggletip
                content={
                  <div className={styles.additionalLabels}>
                    {additionalLabels.map((label) => (
                      <span key={`${label.name}-${label.value}`}>
                        {label.name}: {label.value}
                      </span>
                    ))}
                  </div>
                }
              >
                <button aria-label="View additional labels" className={styles.labelButton} type="button">
                  +{additionalLabels.length} more
                </button>
              </Toggletip>
            ) : null}
          </div>
        ) : null}

        {model.details ? (
          <Toggletip content={<DefinitionDetails title={model.details.title} items={model.details.items} />}>
            <button aria-label="View check definition" className={styles.definitionButton} type="button">
              <Icon name="info-circle" />
              Definition
            </button>
          </Toggletip>
        ) : null}
      </div>
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    minWidth: 0,
  }),
  titleRow: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'space-between',
  }),
  titleGroup: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
    minWidth: 0,
  }),
  title: css({
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    lineHeight: theme.typography.h3.lineHeight,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  compoundBadge: css({
    alignItems: 'center',
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.pill,
    display: 'inline-flex',
    flexShrink: 0,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    overflow: 'hidden',
  }),
  typeLabel: css({
    padding: theme.spacing(0.25, 1),
  }),
  qualifier: css({
    borderLeft: `1px solid ${theme.colors.border.medium}`,
    padding: theme.spacing(0.25, 1),
  }),
  actions: css({ flexShrink: 0 }),
  target: css({
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamilyMonospace,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  definitionRow: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1, 2),
  }),
  factList: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1, 2),
    margin: 0,
  }),
  fact: css({
    alignItems: 'baseline',
    display: 'flex',
    gap: theme.spacing(0.5),
    whiteSpace: 'nowrap',
    '& dt': { color: theme.colors.text.secondary, fontSize: theme.typography.bodySmall.fontSize },
    '& dd': { margin: 0 },
  }),
  labels: css({ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: theme.spacing(0.5) }),
  label: css({
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    padding: theme.spacing(0.25, 0.75),
  }),
  labelButton: css({
    background: 'transparent',
    border: 0,
    color: theme.colors.text.link,
    cursor: 'pointer',
    fontSize: theme.typography.bodySmall.fontSize,
    padding: theme.spacing(0.25, 0.5),
  }),
  definitionButton: css({
    alignItems: 'center',
    background: 'transparent',
    border: 0,
    color: theme.colors.text.link,
    cursor: 'pointer',
    display: 'inline-flex',
    gap: theme.spacing(0.5),
    padding: 0,
  }),
  toggletipContent: css({ display: 'flex', flexDirection: 'column', gap: theme.spacing(1) }),
  detailList: css({
    display: 'grid',
    gap: theme.spacing(0.5, 2),
    gridTemplateColumns: 'minmax(max-content, 1fr) minmax(0, 2fr)',
    margin: 0,
    '& dt': { color: theme.colors.text.secondary },
    '& dd': { margin: 0 },
  }),
  additionalLabels: css({ display: 'flex', flexDirection: 'column', gap: theme.spacing(0.5) }),
});
