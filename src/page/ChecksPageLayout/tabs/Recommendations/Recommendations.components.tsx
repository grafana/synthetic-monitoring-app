import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { t, Trans } from '@grafana/i18n';
import {
  Badge,
  Button,
  Checkbox,
  Icon,
  IconButton,
  LinkButton,
  Pagination,
  Stack,
  Text,
  Tooltip,
  useStyles2,
  useTheme2,
} from '@grafana/ui';
import { cx } from '@emotion/css';
import { RECOMMENDATIONS_TEST_ID } from 'test/dataTestIds';

import { CategorySummary, DismissedChecks, RecommendationSeverity } from './Recommendations.types';
import { Check } from 'types';
import { getCheckType } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { getLegend } from './Recommendations.categories';
import { ROWS_PER_PAGE } from './Recommendations.constants';
import { getCategoryCopy, getCategoryRowCopy, getLegendLabel } from './Recommendations.copy';
import { ATTENTION_VIEW, RecommendationsView } from './Recommendations.hooks';
import { getSeverityColor, getStyles } from './Recommendations.styles';

const PANEL_CLASS: Record<RecommendationSeverity, keyof ReturnType<typeof getStyles>> = {
  error: 'panelError',
  warning: 'panelWarning',
  info: 'panelInfo',
};

interface RailProps {
  categories: CategorySummary[];
  view: RecommendationsView;
  onSelect: (view: RecommendationsView) => void;
}

// Counts are distinct checks, not findings: Redundancy's two findings over 13 checks reads 13.
export function CategoryRail({ categories, view, onSelect }: RailProps) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  return (
    <nav className={styles.rail} aria-label={t('recommendations.rail.label', 'Recommendation categories')}>
      <button
        className={cx(styles.railItem, view === ATTENTION_VIEW && styles.railItemActive)}
        aria-current={view === ATTENTION_VIEW ? 'page' : undefined}
        onClick={() => onSelect(ATTENTION_VIEW)}
      >
        <Icon name="lightbulb-alt" size="sm" />
        <Trans i18nKey="recommendations.rail.attention">Needs attention</Trans>
      </button>
      <div className={styles.railDivider} role="presentation" />
      {categories.map(({ category, checkCount }) => (
        <button
          key={category.id}
          className={cx(styles.railItem, view === category.id && styles.railItemActive)}
          aria-current={view === category.id ? 'page' : undefined}
          onClick={() => onSelect(category.id)}
        >
          <span
            className={styles.railDot}
            style={{ backgroundColor: getSeverityColor(theme, category.severity) }}
            role="presentation"
          />
          {getCategoryCopy(category.id).label}
          <span className={styles.railCount}>{checkCount}</span>
        </button>
      ))}
    </nav>
  );
}

interface AttentionRowProps {
  summary: CategorySummary;
  totalCheckCount: number;
  dismissedChecks: DismissedChecks;
  onSelect: () => void;
}

export function AttentionRow({ summary, totalCheckCount, dismissedChecks, onSelect }: AttentionRowProps) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const { label } = getCategoryCopy(summary.category.id);
  const row = getCategoryRowCopy(summary, totalCheckCount, dismissedChecks);

  return (
    <button
      className={styles.attentionRow}
      style={{ borderLeftColor: getSeverityColor(theme, summary.category.severity) }}
      onClick={onSelect}
      data-testid={RECOMMENDATIONS_TEST_ID.attentionRow}
    >
      <span className={styles.attentionLabel}>{label}</span>
      <Text variant="bodySmall" color="secondary">
        {row.summary}
      </Text>
      <span className={styles.attentionAction}>
        {row.action}
        <Icon name="angle-right" size="sm" />
      </span>
    </button>
  );
}

interface LegendProps {
  findings: Parameters<typeof getLegend>[0];
}

export function SeverityLegend({ findings }: LegendProps) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const entries = getLegend(findings);

  if (entries.length === 0) {
    return null;
  }

  return (
    <span className={styles.legend} data-testid={RECOMMENDATIONS_TEST_ID.legend}>
      {entries.map(({ severity, checkCount }) => (
        <span key={severity} className={styles.legendEntry}>
          <span
            className={styles.legendBar}
            style={{ backgroundColor: getSeverityColor(theme, severity) }}
            role="presentation"
          />
          {getLegendLabel(severity, checkCount)}
        </span>
      ))}
    </span>
  );
}

interface SectionProps {
  title: string;
  summary?: string;
  tooltip?: string;
  severity: RecommendationSeverity;
  /** One button at most, so the header stays one line and the title is what gives way. */
  actions?: ReactNode;
  footer?: ReactNode;
  /** Deep-linked to from the URL: highlighted and scrolled into view. */
  isFocused?: boolean;
  onDismiss: () => void;
  children: ReactNode;
}

export function RecommendationSection({
  title,
  summary,
  tooltip,
  severity,
  actions,
  footer,
  isFocused = false,
  onDismiss,
  children,
}: SectionProps) {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused) {
      // jsdom has no scrollIntoView.
      panelRef.current?.scrollIntoView?.({ block: 'start' });
    }
  }, [isFocused]);

  return (
    <div
      ref={panelRef}
      className={cx(styles.panel, styles[PANEL_CLASS[severity]], isFocused && styles.panelFocused)}
      data-testid={RECOMMENDATIONS_TEST_ID.section}
    >
      <div className={styles.panelHeader} data-testid={RECOMMENDATIONS_TEST_ID.sectionHeader}>
        <button className={styles.collapseToggle} onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
          <Icon name={isOpen ? 'angle-down' : 'angle-right'} className={styles.caret} />
          <Stack direction="column" gap={0.25}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionTitleText}>{title}</span>
              {tooltip && (
                <Tooltip content={tooltip} placement="top">
                  <Icon name="info-circle" size="sm" className={styles.tooltipIcon} />
                </Tooltip>
              )}
              {isFocused && (
                <Badge color="blue" text={t('recommendations.section.openedFromLink', 'Opened from a link')} />
              )}
            </h3>
            {summary && (
              <Text variant="bodySmall" color="secondary">
                {summary}
              </Text>
            )}
          </Stack>
        </button>
        <div className={styles.panelActions}>
          {actions}
          <IconButton
            name="times"
            size="sm"
            variant="secondary"
            tooltip={t('recommendations.section.dismiss', 'Dismiss this finding')}
            onClick={onDismiss}
          />
        </div>
      </div>
      {isOpen && (
        <>
          <div className={styles.rows}>{children}</div>
          {footer}
        </>
      )}
    </div>
  );
}

interface HeaderActionProps {
  label?: string;
  selectedCount: number;
  isBusy?: boolean;
  onAction: () => void;
  onClearSelection: () => void;
}

// One slot means "for all" with nothing ticked and "for the selection" otherwise, so findings
// with and without a bulk action lay out the same. No select-all: the all-variant covers it.
export function HeaderAction({ label, selectedCount, isBusy = false, onAction, onClearSelection }: HeaderActionProps) {
  if (!label) {
    return null;
  }

  return (
    <>
      {selectedCount > 0 && (
        // Not a ✕: the finding's dismiss is one, two buttons along.
        <Button size="sm" variant="secondary" fill="text" disabled={isBusy} onClick={onClearSelection}>
          <Trans i18nKey="recommendations.selection.clear">Clear selection</Trans>
        </Button>
      )}
      <Button size="sm" variant="primary" onClick={onAction} disabled={isBusy}>
        {label}
      </Button>
    </>
  );
}

interface PanelFooterProps {
  dismissedCount?: number;
  onRestore?: () => void;
  secondaryAction?: ReactNode;
}

// The link out lives here rather than in the header so the header can stay one line.
export function PanelFooter({ dismissedCount = 0, onRestore, secondaryAction }: PanelFooterProps) {
  const styles = useStyles2(getStyles);

  if (dismissedCount === 0 && !secondaryAction) {
    return null;
  }

  return (
    <Stack direction="row" gap={1} alignItems="center" justifyContent="flex-end">
      {dismissedCount > 0 && (
        <>
          <span className={styles.mutedText}>
            {dismissedCount === 1
              ? t('recommendations.dismissedChecks.summarySingle', '1 check dismissed')
              : t('recommendations.dismissedChecks.summary', '{{dismissedCount}} checks dismissed', { dismissedCount })}
          </span>
          <Button size="sm" variant="secondary" fill="outline" icon="eye" onClick={onRestore}>
            <Trans i18nKey="recommendations.dismissedChecks.restore">Show dismissed checks</Trans>
          </Button>
        </>
      )}
      {secondaryAction}
    </Stack>
  );
}

interface PaginatedRowsProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
}

export function PaginatedRows<T>({ items, renderItem }: PaginatedRowsProps<T>) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / ROWS_PER_PAGE);
  // Acting on a row can shrink the list out from under the current page.
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
  detail?: ReactNode;
  /** Replaces the controls once the row has been acted on, e.g. "Alerts added". */
  doneLabel?: string;
  isSelected?: boolean;
  /** The checkbox only renders when given. */
  onSelectChange?: (check: Check) => void;
  action?: ReactNode;
  /** Rendered under the row, e.g. a preview of what `action` will do. */
  expansion?: ReactNode;
  /** Off where editing is itself the row's `action`. */
  showEditButton?: boolean;
  onEditClick?: () => void;
  /** The dismiss button only renders when given. */
  onDismiss?: (check: Check) => void;
}

export function CheckRow({
  check,
  detail,
  doneLabel,
  isSelected = false,
  onSelectChange,
  action,
  expansion,
  showEditButton = true,
  onEditClick,
  onDismiss,
}: CheckRowProps) {
  const styles = useStyles2(getStyles);
  const isDone = doneLabel !== undefined;

  return (
    <div>
      <div className={cx(styles.row, isSelected && styles.rowSelected)}>
        {onSelectChange && !isDone && (
          <Checkbox
            value={isSelected}
            onChange={() => onSelectChange(check)}
            aria-label={t('recommendations.row.select', 'Select {{job}}', { job: check.job })}
          />
        )}
        <div className={styles.rowMain}>
          <span className={styles.rowName}>{check.job}</span>
          <span className={styles.rowType}>{getCheckType(check.settings)}</span>
          {!isDone && detail && <span className={styles.rowDetail}>{detail}</span>}
        </div>
        <div className={styles.rowControls}>
          {isDone ? (
            <span className={styles.doneText}>{doneLabel}</span>
          ) : (
            <>
              {showEditButton && (
                <LinkButton
                  size="sm"
                  variant="secondary"
                  fill="outline"
                  icon="pen"
                  href={generateRoutePath(AppRoutes.EditCheck, { id: check.id! })}
                  aria-label={t('recommendations.row.editCheck', 'Edit {{job}}', { job: check.job })}
                  onClick={onEditClick}
                />
              )}
              {action}
              {onDismiss && (
                <IconButton
                  name="times"
                  size="sm"
                  variant="secondary"
                  tooltip={t('recommendations.row.dismiss', 'Dismiss {{job}} from this finding', { job: check.job })}
                  onClick={() => onDismiss(check)}
                />
              )}
            </>
          )}
        </div>
      </div>
      {expansion}
    </div>
  );
}

interface GroupRowProps {
  label: string;
  detail: string;
  checks: Check[];
  /** The check list filtered to this group, where bulk delete lives. */
  href: string;
  onLinkClick?: () => void;
  renderCheck?: (check: Check) => ReactNode;
}

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
      {/* Siblings, not nested: a link inside a button is unreachable by assistive tech. */}
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
