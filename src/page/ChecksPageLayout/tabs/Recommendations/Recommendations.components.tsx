import React, { ReactNode, useState } from 'react';
import { t } from '@grafana/i18n';
import { Badge, Icon, Pagination, Stack, Tooltip, useStyles2 } from '@grafana/ui';
import { cx } from '@emotion/css';
import { RECOMMENDATIONS_TEST_ID } from 'test/dataTestIds';

import { RecommendationSeverity } from './Recommendations.types';
import { Check } from 'types';
import { getCheckType } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { getStyles } from './Recommendations.styles';

const ROWS_PER_PAGE = 7;

interface SectionProps {
  title: string;
  tooltip: string;
  summary: string;
  action?: ReactNode;
  children: ReactNode;
}

/** A collapsible finding: heading with an explanatory tooltip, a summary line, then its rows. */
export function RecommendationSection({ title, tooltip, summary, action, children }: SectionProps) {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div data-testid={RECOMMENDATIONS_TEST_ID.section}>
      <button className={styles.collapseToggle} onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
        <h3 className={styles.sectionHeading}>
          {title}
          <Tooltip content={tooltip} placement="top">
            <Icon name="info-circle" size="sm" className={styles.tooltipIcon} />
          </Tooltip>
        </h3>
      </button>
      {isOpen && (
        <Stack direction="column" gap={1}>
          <span className={styles.mutedText}>{summary}</span>
          <Stack direction="column" gap={0.5}>
            {children}
          </Stack>
          {action && <Stack justifyContent="flex-end">{action}</Stack>}
        </Stack>
      )}
    </div>
  );
}

interface PaginatedRowsProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
}

/** Large tenants can have hundreds of affected checks, so rows are paged rather than dumped. */
export function PaginatedRows<T>({ items, renderItem }: PaginatedRowsProps<T>) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / ROWS_PER_PAGE);
  const visible = items.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return (
    <>
      {visible.map(renderItem)}
      {totalPages > 1 && (
        <Stack justifyContent="flex-end">
          <Pagination currentPage={page} numberOfPages={totalPages} onNavigate={setPage} />
        </Stack>
      )}
    </>
  );
}

const INDICATOR_CLASS: Record<RecommendationSeverity, keyof ReturnType<typeof getStyles>> = {
  error: 'indicatorError',
  warning: 'indicatorWarning',
  info: 'indicatorInfo',
};

interface CheckRowProps {
  check: Check;
  severity: RecommendationSeverity;
  /** Right-hand text, e.g. why this check was flagged. */
  detail?: string;
}

/** One affected check: severity bar, name, a link to its editor, and the type badge. */
export function CheckRow({ check, severity, detail }: CheckRowProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.row}>
      <div className={cx(styles.indicator, styles[INDICATOR_CLASS[severity]])} />
      <Stack direction="row" gap={0.5} alignItems="center" wrap="wrap" grow={1}>
        <span className={styles.rowName}>{check.job}</span>
        <a
          className={styles.checkLink}
          href={generateRoutePath(AppRoutes.EditCheck, { id: check.id! })}
          aria-label={t('recommendations.row.editCheck', 'Edit {{job}}', { job: check.job })}
        >
          <Icon name="pen" size="xs" />
        </a>
        <Badge text={getCheckType(check.settings)} color="blue" />
        {!check.enabled && <Badge text={t('recommendations.row.paused', 'paused')} color="orange" />}
      </Stack>
      {detail && <span className={styles.rowDetail}>{detail}</span>}
    </div>
  );
}

interface GroupRowProps {
  label: string;
  detail: string;
  severity: RecommendationSeverity;
  checks: Check[];
}

/** A cluster of checks that share something, expandable to the checks inside it. */
export function GroupRow({ label, detail, severity, checks }: GroupRowProps) {
  const styles = useStyles2(getStyles);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <div
        className={cx(styles.row, styles.rowClickable)}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div className={cx(styles.indicator, styles[INDICATOR_CLASS[severity]])} />
        <Stack direction="row" gap={0.5} alignItems="center" grow={1}>
          <Icon name={isExpanded ? 'angle-down' : 'angle-right'} size="sm" />
          <span className={styles.rowName}>{label}</span>
        </Stack>
        <span className={styles.rowDetail}>{detail}</span>
      </div>
      {isExpanded && (
        <div className={styles.nestedRows}>
          {checks.map((check) => (
            <CheckRow key={check.id} check={check} severity={severity} />
          ))}
        </div>
      )}
    </div>
  );
}
