import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Tag, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckHeaderDefinitionModel } from './CheckDashboardHeader.types';
import { Toggletip } from 'components/Toggletip';

const MAX_INLINE_LABELS = 3;

function formatLabelName(name: string, value: string) {
  return `${name}: ${value}`;
}

export function CheckDefinitionSummary({ model }: { model: CheckHeaderDefinitionModel }) {
  const styles = useStyles2(getStyles);
  const visibleLabels = model.labels.slice(0, MAX_INLINE_LABELS);
  const additionalLabels = model.labels.slice(MAX_INLINE_LABELS);

  return (
    <section aria-label="Check configuration" className={styles.container}>
      <div className={styles.definitionRow}>
        <div className={styles.group}>
          <span className={styles.groupLabel}>Configuration</span>
          <dl className={styles.factList}>
            {model.facts.map((fact) => (
              <div className={styles.fact} key={fact.id}>
                {fact.icon ? <Icon className={styles.factIcon} name={fact.icon} aria-hidden /> : null}
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {model.labels.length > 0 ? (
          <div className={cx(styles.group, styles.labelsGroup)}>
            <span className={styles.groupLabel}>Labels</span>
            <div aria-label="Labels" className={styles.labels}>
              {visibleLabels.map((label) => (
                <Tag
                  key={`${label.name}-${label.value}`}
                  name={formatLabelName(label.name, label.value)}
                  className={styles.label}
                />
              ))}
              {additionalLabels.length > 0 ? (
                <Toggletip
                  content={
                    <div className={styles.additionalLabels}>
                      {additionalLabels.map((label) => (
                        <Tag
                          key={`${label.name}-${label.value}`}
                          name={formatLabelName(label.name, label.value)}
                          className={styles.label}
                        />
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
          </div>
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
    width: '100%',
  }),
  definitionRow: css({
    alignItems: 'flex-end',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1.5, 3),
    justifyContent: 'space-between',
  }),
  group: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.75),
    minWidth: 0,
  }),
  labelsGroup: css({
    alignItems: 'flex-end',
  }),
  groupLabel: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    letterSpacing: '0.05em',
    lineHeight: 1,
    textTransform: 'uppercase',
  }),
  factList: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    margin: 0,
  }),
  fact: css({
    alignItems: 'center',
    border: `2px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.pill,
    display: 'flex',
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.5, 2),
    whiteSpace: 'nowrap',
    '& dt': { color: theme.colors.text.secondary, fontSize: theme.typography.body.fontSize },
    '& dd': {
      fontSize: theme.typography.body.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      margin: 0,
    },
  }),
  factIcon: css({
    color: theme.colors.text.secondary,
    marginRight: theme.spacing(0.25),
  }),
  labels: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    justifyContent: 'flex-end',
  }),
  label: css({
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  labelButton: css({
    background: 'transparent',
    border: 0,
    color: theme.colors.text.link,
    cursor: 'pointer',
    fontSize: theme.typography.bodySmall.fontSize,
    padding: theme.spacing(0.25, 0.5),
  }),
  additionalLabels: css({ display: 'flex', flexDirection: 'column', gap: theme.spacing(0.5) }),
});
