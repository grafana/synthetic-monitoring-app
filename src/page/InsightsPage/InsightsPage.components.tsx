import React from 'react';
import { Button, Icon, Pagination, Stack, Tooltip, useStyles2 } from '@grafana/ui';
import { openAssistant as openAssistantSidebar } from '@grafana/assistant';

import { useIsAssistantAvailable } from './InsightsPage.hooks';
import { getStyles } from './InsightsPage.styles';
import { PERF_PAGE_SIZE } from './InsightsPage.utils';

export function SectionHeading({ title, tooltip }: { title: string; tooltip: string }) {
  const styles = useStyles2(getStyles);

  return (
    <h3 className={styles.sectionHeading}>
      {title}
      <Tooltip content={tooltip} placement="top">
        <Icon name="info-circle" size="sm" className={styles.tooltipIcon} />
      </Tooltip>
    </h3>
  );
}

export function AssistantButton({ prompt, origin, title, size = 'md' }: { prompt: string; origin: string; title: string; size?: 'sm' | 'md' }) {
  const available = useIsAssistantAvailable();

  if (!available) {
    return null;
  }

  return (
    <Button
      size={size}
      variant="secondary"
      fill="text"
      icon="ai-sparkle"
      onClick={() => openAssistantSidebar({ origin, prompt, autoSend: true })}
    >
      {title}
    </Button>
  );
}

export function PaginatedList<T>({ items, renderItem, pageSize = PERF_PAGE_SIZE }: { items: T[]; renderItem: (item: T, index: number) => React.ReactNode; pageSize?: number }) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(items.length / pageSize);
  const visible = items.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      {visible.map((item, i) => renderItem(item, (page - 1) * pageSize + i))}
      {totalPages > 1 && (
        <Stack justifyContent="flex-end">
          <Pagination currentPage={page} numberOfPages={totalPages} onNavigate={setPage} />
        </Stack>
      )}
    </>
  );
}

export function LimitBar({ label, current, max, href }: { label: string; current: number; max: number; href?: string }) {
  const styles = useStyles2(getStyles);
  const pct = max > 0 ? (current / max) * 100 : 0;
  const isHigh = pct > 80;

  return (
    <div>
      <div className={styles.limitLabel}>
        {href ? <a href={href} className={styles.subtleLink}>{label}</a> : <span>{label}</span>}
        <span>{current} / {max}</span>
      </div>
      <div className={styles.limitBarTrack}>
        <div
          className={isHigh ? styles.limitBarFillWarning : styles.limitBarFill}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function ProbeHistogram({ histogram }: { histogram: Record<number, number> }) {
  const styles = useStyles2(getStyles);
  const entries = Object.entries(histogram)
    .map(([probes, count]) => ({ probes: Number(probes), count }))
    .sort((a, b) => a.probes - b.probes);

  const maxCount = Math.max(...entries.map((e) => e.count), 1);

  return (
    <Stack direction="column" gap={0.5}>
      {entries.map(({ probes, count }) => (
        <div key={probes} className={styles.histogramRow}>
          <span className={styles.histogramRowLabel}>{probes} {probes === 1 ? 'probe' : 'probes'}</span>
          <div className={styles.histogramRowTrack}>
            <div className={styles.histogramRowFill} style={{ width: `${(count / maxCount) * 100}%` }} />
          </div>
          <span className={styles.histogramRowCount}>{count}</span>
        </div>
      ))}
    </Stack>
  );
}
