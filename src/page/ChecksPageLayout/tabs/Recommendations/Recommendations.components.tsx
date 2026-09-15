import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { t } from '@grafana/i18n';
import { Badge, Icon, IconButton, Pagination, Stack, Text, Tooltip, useStyles2 } from '@grafana/ui';
import { cx } from '@emotion/css';
import { RECOMMENDATIONS_TEST_ID } from 'test/dataTestIds';

import { RecommendationSeverity } from './Recommendations.types';
import { Check } from 'types';
import { getCheckType } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { ROWS_PER_PAGE } from './Recommendations.constants';
import { getStyles } from './Recommendations.styles';

const PANEL_CLASS: Record<RecommendationSeverity, keyof ReturnType<typeof getStyles>> = {
  error: 'panelError',
  warning: 'panelWarning',
  info: 'panelInfo',
};

interface SectionProps {
  title: string;
  tooltip: string;
  summary: string;
  severity: RecommendationSeverity;
  /** Finding-level controls, rendered in the header beside the title. */
  actions?: ReactNode;
  /** The URL pointed at this finding; it is highlighted and scrolled into view. */
  isFocused?: boolean;
  onDismiss: () => void;
  children: ReactNode;
}

/**
 * A finding as a collapsible panel. The severity colour sits on the panel's left edge, and the
 * summary lives in the header so a collapsed finding still states the problem.
 */
export function RecommendationSection({
  title,
  tooltip,
  summary,
  severity,
  actions,
  isFocused = false,
  onDismiss,
  children,
}: SectionProps) {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused) {
      // Optional call: jsdom has no scrollIntoView.
      panelRef.current?.scrollIntoView?.({ block: 'start' });
    }
  }, [isFocused]);

  return (
    <div
      ref={panelRef}
      className={cx(styles.panel, styles[PANEL_CLASS[severity]], isFocused && styles.panelFocused)}
      data-testid={RECOMMENDATIONS_TEST_ID.section}
    >
      <Stack direction="row" gap={1.5} alignItems="flex-start">
        <button className={styles.collapseToggle} onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
          <Icon name={isOpen ? 'angle-down' : 'angle-right'} className={styles.caret} />
          <Stack direction="column" gap={0.25}>
            <h3 className={styles.sectionTitle}>
              {title}
              <Tooltip content={tooltip} placement="top">
                <Icon name="info-circle" size="sm" className={styles.tooltipIcon} />
              </Tooltip>
              {isFocused && (
                <Badge color="blue" text={t('recommendations.section.openedFromLink', 'Opened from a link')} />
              )}
            </h3>
            <Text variant="bodySmall" color="secondary">
              {summary}
            </Text>
          </Stack>
        </button>
        <Stack direction="row" gap={1} alignItems="center" justifyContent="flex-end" grow={1}>
          {actions}
          <IconButton
            name="times"
            size="sm"
            variant="secondary"
            tooltip={t('recommendations.section.dismiss', 'Dismiss this finding')}
            onClick={onDismiss}
          />
        </Stack>
      </Stack>
      {isOpen && <div className={styles.rows}>{children}</div>}
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

interface CheckRowProps {
  check: Check;
  /** Right-hand text, e.g. why this check was flagged. */
  detail?: string;
  /** A control for acting on this check in place, rendered at the far right. */
  action?: ReactNode;
  /** Content shown underneath the row, e.g. a preview of what `action` will do. */
  expansion?: ReactNode;
  onEditClick?: () => void;
}

/** One affected check: name, a link to its editor, its type, and an optional action. */
export function CheckRow({ check, detail, action, expansion, onEditClick }: CheckRowProps) {
  const styles = useStyles2(getStyles);

  return (
    <div>
      <div className={styles.row}>
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
          <span className={styles.rowType}>{getCheckType(check.settings)}</span>
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
  checks: Check[];
  /** Where to see this group in the check list, e.g. to bulk-select and delete from there. */
  href: string;
  onLinkClick?: () => void;
  /** How to render each check once the group is expanded; a plain `CheckRow` by default. */
  renderCheck?: (check: Check) => ReactNode;
}

/** A cluster of checks that share something, expandable to the checks inside it. */
export function GroupRow({
  label,
  detail,
  checks,
  href,
  onLinkClick,
  renderCheck = (check) => <CheckRow key={check.id} check={check} />,
}: GroupRowProps) {
  const styles = useStyles2(getStyles);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      {/* The toggle and the link are siblings rather than nested: a link inside a button is not
          reachable by assistive tech, and the row itself is not interactive for the same reason. */}
      <div className={styles.row}>
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
      {isExpanded && <div className={styles.nestedRows}>{checks.map(renderCheck)}</div>}
    </div>
  );
}
