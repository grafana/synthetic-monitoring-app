import React from 'react';
import { type ReactElement } from 'react';
import type { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import type { TestEntry, TestStatus } from './svalinn.types';

import { CategoryTag } from './SuggestionsPanel';

interface Props {
  entries: TestEntry[];
}

export function TestSuiteTable({ entries }: Props): ReactElement {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.panel}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: '80px' }}>Status</th>
            <th>Test Name</th>
            <th style={{ width: '100px' }}>Type</th>
            <th style={{ width: '140px' }}>Hosted In</th>
            <th style={{ width: '200px' }}>Linked Incident</th>
            <th style={{ width: '70px' }}>Last Run</th>
            <th style={{ width: '50px' }}></th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'inherit' }}>
                No tests found. Create a test from one of the suggestions above to get started.
              </td>
            </tr>
          ) : (
            entries.map((entry) => <TestRow key={entry.name} entry={entry} />)
          )}
        </tbody>
      </table>
    </div>
  );
}

function TestRow({ entry }: { entry: TestEntry }): ReactElement {
  const styles = useStyles2(getStyles);

  return (
    <tr>
      <td>
        <StatusBadge status={entry.status} />
      </td>
      <td>
        <a href="#" className={styles.nameLink}>
          {entry.name}
        </a>
      </td>
      <td>
        <CategoryTag category={entry.type} />
      </td>
      <td>
        <ProductBadge product={entry.product} />
      </td>
      <td>
        {entry.linkedIncident ? (
          <a href="#" className={styles.incidentLink}>
            {entry.linkedIncident}
          </a>
        ) : (
          <span className={styles.incidentNone}>—</span>
        )}
      </td>
      <td className={styles.lastRun}>{entry.lastRun}</td>
      <td>
        <a href="#" className={styles.viewLink}>
          View →
        </a>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: TestStatus }): ReactElement {
  const styles = useStyles2(getStyles);
  const label = status === 'pass' ? 'Pass' : status === 'warn' ? 'Warn' : 'Fail';
  return (
    <span className={`${styles.statusBadge} ${styles[`status_${status}`]}`}>
      <span className={styles.statusDot} />
      {label}
    </span>
  );
}

function ProductBadge({ product }: { product: 'k6' | 'synthetics' }): ReactElement {
  const styles = useStyles2(getStyles);
  const isK6 = product === 'k6';
  return (
    <span className={styles.productBadge}>
      <span className={`${styles.productIcon} ${isK6 ? styles.productIconK6 : styles.productIconSM}`}>
        {isK6 ? 'k6' : 'SM'}
      </span>
      <a href="#" className={styles.productLink}>
        {isK6 ? 'Performance' : 'Synthetics'}
      </a>
    </span>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    panel: css({
      background: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
      overflow: 'hidden',
    }),
    table: css({
      width: '100%',
      borderCollapse: 'collapse',
      th: {
        textAlign: 'left',
        fontSize: '11px',
        fontWeight: theme.typography.fontWeightMedium,
        color: theme.colors.text.disabled,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        padding: `${theme.spacing(1.25)} ${theme.spacing(1.5)}`,
        borderBottom: `1px solid ${theme.colors.border.weak}`,
        background: theme.colors.background.primary,
      },
      td: {
        padding: `${theme.spacing(1.25)} ${theme.spacing(1.5)}`,
        fontSize: '13px',
        borderBottom: `1px solid ${theme.colors.border.weak}`,
        verticalAlign: 'middle',
      },
      'tr:last-child td': { borderBottom: 'none' },
      'tr:hover td': { background: theme.colors.background.secondary },
    }),
    statusBadge: css({
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme.spacing(0.75),
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    statusDot: css({
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: 'currentColor',
    }),
    status_pass: css({ color: theme.colors.success.text }),
    status_warn: css({ color: theme.colors.warning.text }),
    status_fail: css({ color: theme.colors.error.text }),
    nameLink: css({
      color: theme.colors.text.link,
      fontWeight: theme.typography.fontWeightRegular,
      textDecoration: 'none',
      '&:hover': { textDecoration: 'underline' },
    }),
    incidentLink: css({
      color: theme.colors.warning.text,
      fontSize: theme.typography.bodySmall.fontSize,
      textDecoration: 'none',
      '&:hover': { textDecoration: 'underline' },
    }),
    incidentNone: css({
      color: theme.colors.text.disabled,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    lastRun: css({
      color: theme.colors.text.disabled,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    productBadge: css({
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme.spacing(0.625),
      fontSize: '11px',
      color: theme.colors.text.secondary,
    }),
    productIcon: css({
      width: '14px',
      height: '14px',
      borderRadius: '3px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '8px',
      flexShrink: 0,
      color: '#fff',
    }),
    productIconK6: css({ background: '#7d64ff' }),
    productIconSM: css({ background: '#3871dc' }),
    productLink: css({
      color: theme.colors.text.link,
      textDecoration: 'none',
      fontSize: '11px',
      '&:hover': { textDecoration: 'underline' },
    }),
    viewLink: css({
      color: theme.colors.text.link,
      textDecoration: 'none',
      fontSize: theme.typography.bodySmall.fontSize,
      whiteSpace: 'nowrap',
      '&:hover': { textDecoration: 'underline' },
    }),
  };
}
