import React, { ReactNode, useState } from 'react';
import { t } from '@grafana/i18n';
import { Badge, Icon, IconButton, Pagination, Stack, Tooltip, useStyles2 } from '@grafana/ui';
import { cx } from '@emotion/css';
import { RECOMMENDATIONS_TEST_ID } from 'test/dataTestIds';

import { RecommendationSeverity } from './Recommendations.types';
import { Check } from 'types';
import { getCheckType } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { ROWS_PER_PAGE } from './Recommendations.constants';
import { getStyles } from './Recommendations.styles';

interface SectionProps {
  title: string;
  tooltip: string;
  summary: string;
  /** Finding-level controls, rendered under the rows and right-aligned. */
  actions?: ReactNode;
  onDismiss: () => void;
  children: ReactNode;
}

/** A collapsible finding: heading with an explanatory tooltip, a summary line, then its rows. */
export function RecommendationSection({ title, tooltip, summary, actions, onDismiss, children }: SectionProps) {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div data-testid={RECOMMENDATIONS_TEST_ID.section}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <button className={styles.collapseToggle} onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
          <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
          <h3 className={styles.sectionHeading}>
            {title}
            <Tooltip content={tooltip} placement="top">
              <Icon name="info-circle" size="sm" className={styles.tooltipIcon} />
            </Tooltip>
          </h3>
        </button>
        <IconButton
          name="times"
          size="sm"
          variant="secondary"
          tooltip={t('recommendations.section.dismiss', 'Dismiss this finding')}
          onClick={onDismiss}
        />
      </Stack>
      {isOpen && (
        <Stack direction="column" gap={1}>
          <span className={styles.mutedText}>{summary}</span>
          <Stack direction="column" gap={0.5}>
            {children}
          </Stack>
          {actions && (
            <Stack justifyContent="flex-end" gap={1}>
              {actions}
            </Stack>
          )}
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
  // Acting on a row can shrink the list; keep the page in range rather than showing an empty one.
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const visible = items.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  return (
    <>
      {visible.map(renderItem)}
      {totalPages > 1 && (
        <Stack justifyContent="flex-end">
          <Pagination currentPage={currentPage} numberOfPages={totalPages} onNavigate={setPage} />
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
  /** A control for acting on this check in place, rendered at the far right. */
  action?: ReactNode;
  /** Content shown underneath the row, e.g. a preview of what `action` will do. */
  expansion?: ReactNode;
  onEditClick?: () => void;
}

/** One affected check: severity bar, name, a link to its editor, the type badge and an optional action. */
export function CheckRow({ check, severity, detail, action, expansion, onEditClick }: CheckRowProps) {
  const styles = useStyles2(getStyles);

  return (
    <div>
      <div className={styles.row}>
        <div className={cx(styles.indicator, styles[INDICATOR_CLASS[severity]])} />
        <Stack direction="row" gap={0.5} alignItems="center" wrap="wrap" grow={1}>
          <span className={styles.rowName}>{check.job}</span>
          <a
            className={styles.checkLink}
            href={generateRoutePath(AppRoutes.EditCheck, { id: check.id! })}
            aria-label={t('recommendations.row.editCheck', 'Edit {{job}}', { job: check.job })}
            onClick={onEditClick}
          >
            <Icon name="pen" size="xs" />
          </a>
          <Badge text={getCheckType(check.settings)} color="blue" />
          {!check.enabled && <Badge text={t('recommendations.row.paused', 'paused')} color="orange" />}
        </Stack>
        {detail && <span className={styles.rowDetail}>{detail}</span>}
        {action}
      </div>
      {expansion}
    </div>
  );
}

interface GroupRowProps {
  label: string;
  detail: string;
  severity: RecommendationSeverity;
  checks: Check[];
  /** Where to see this group in the check list, e.g. to bulk-select and delete from there. */
  href: string;
  onLinkClick?: () => void;
  onCheckEditClick?: () => void;
}

/** A cluster of checks that share something, expandable to the checks inside it. */
export function GroupRow({ label, detail, severity, checks, href, onLinkClick, onCheckEditClick }: GroupRowProps) {
  const styles = useStyles2(getStyles);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      {/* The toggle and the link are siblings rather than nested: a link inside a button is not
          reachable by assistive tech, and the row itself is not interactive for the same reason. */}
      <div className={styles.row}>
        <div className={cx(styles.indicator, styles[INDICATOR_CLASS[severity]])} />
        <button className={styles.groupToggle} onClick={() => setIsExpanded(!isExpanded)} aria-expanded={isExpanded}>
          <Icon name={isExpanded ? 'angle-down' : 'angle-right'} size="sm" />
          <span className={styles.rowName}>{label}</span>
        </button>
        <a
          className={styles.checkLink}
          href={href}
          aria-label={t('recommendations.group.viewInList', 'Show these checks in the check list')}
          onClick={onLinkClick}
        >
          <Icon name="search" size="xs" />
        </a>
        <span className={styles.rowDetail}>{detail}</span>
      </div>
      {isExpanded && (
        <div className={styles.nestedRows}>
          {checks.map((check) => (
            <CheckRow key={check.id} check={check} severity={severity} onEditClick={onCheckEditClick} />
          ))}
        </div>
      )}
    </div>
  );
}
