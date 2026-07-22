import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckHeaderDefinitionModel, HeaderDefinitionFact } from './CheckDashboardHeader.types';
import { Toggletip } from 'components/Toggletip';

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

export function CheckDefinitionSummary({ model }: { model: CheckHeaderDefinitionModel }) {
  const styles = useStyles2(getStyles);

  return (
    <section aria-label="Check configuration" className={styles.container}>
      <div className={styles.definitionRow}>
        <dl className={styles.factList}>
          {model.facts.map((fact) => (
            <div className={styles.fact} key={fact.id}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

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
    maxWidth: '1040px',
    width: '100%',
  }),
  definitionRow: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5, 1),
  }),
  factList: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5, 1),
    margin: 0,
  }),
  fact: css({
    alignItems: 'baseline',
    display: 'flex',
    gap: theme.spacing(0.5),
    whiteSpace: 'nowrap',
    '& dt': { color: theme.colors.text.secondary, fontSize: theme.typography.bodySmall.fontSize },
    '& dd': { fontSize: theme.typography.bodySmall.fontSize, margin: 0 },
  }),
  definitionButton: css({
    alignItems: 'center',
    background: 'transparent',
    border: 0,
    color: theme.colors.text.link,
    cursor: 'pointer',
    display: 'inline-flex',
    gap: theme.spacing(0.5),
    marginLeft: 'auto',
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
});
