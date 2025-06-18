import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Trace, TraceSpan } from './TraceAndSpans.types';

// import { trace } from './mockTrace';

interface TraceAndSpansProps {
  trace: Trace;
  onSpanClick?: (span: TraceSpan) => void;
}

export function TraceAndSpans({ trace, onSpanClick }: TraceAndSpansProps) {
  const styles = useStyles2(getStyles);
  const [collapsedSpans, setCollapsedSpans] = useState<Set<string>>(new Set());

  const toggleSpanCollapse = (spanId: string) => {
    const newCollapsed = new Set(collapsedSpans);
    if (newCollapsed.has(spanId)) {
      newCollapsed.delete(spanId);
    } else {
      newCollapsed.add(spanId);
    }
    setCollapsedSpans(newCollapsed);
  };

  const formatDuration = (microseconds: number): string => {
    const ms = microseconds / 1000;
    if (ms < 1) {
      return `${Math.round(microseconds)}μs`;
    }
    if (ms < 1000) {
      return `${ms.toFixed(2)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getSpanWidth = (span: TraceSpan): number => {
    return Math.max((span.duration / trace.duration) * 100, 0.1);
  };

  const getSpanOffset = (span: TraceSpan): number => {
    return (span.relativeStartTime / trace.duration) * 100;
  };

  const getVisibleSpans = (): TraceSpan[] => {
    const visibleSpans: TraceSpan[] = [];
    const spanMap = new Map(trace.spans.map((span) => [span.spanID, span]));

    for (const span of trace.spans) {
      // Check if any parent span is collapsed
      let isVisible = true;
      let currentSpan = span;

      // Walk up the hierarchy using references
      while (currentSpan.references.length > 0) {
        const parentRef = currentSpan.references[0];
        const parentSpan = spanMap.get(parentRef.spanID);

        if (parentSpan && collapsedSpans.has(parentSpan.spanID)) {
          isVisible = false;
          break;
        }

        currentSpan = parentSpan || currentSpan;
        if (!parentSpan) {
          break;
        }
      }

      if (isVisible) {
        visibleSpans.push(span);
      }
    }

    return visibleSpans;
  };

  const renderTimelineRuler = () => {
    const markers = [0, 25, 50, 75, 100];
    return (
      <div className={styles.timelineRulerContainer}>
        <div className={styles.timelineRulerSpacer}></div>
        <div className={styles.timelineRuler}>
          {markers.map((percent) => {
            const time = (trace.duration * percent) / 100;
            return (
              <div key={percent} className={styles.timelineMarker} style={{ left: `${percent}%` }}>
                {formatDuration(time)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSpan = (span: TraceSpan, index: number) => {
    const isCollapsed = collapsedSpans.has(span.spanID);
    const hasChildren = span.hasChildren;
    const indentLevel = span.depth;

    // Find parent spans and determine which vertical lines to draw
    const parentLevels: number[] = [];
    for (let level = 1; level <= indentLevel; level++) {
      parentLevels.push(level);
    }

    return (
      <div key={span.spanID} className={styles.spanRow}>
        <div className={styles.spanInfo}>
          <div className={styles.spanDetails} style={{ paddingLeft: `${indentLevel * 20}px` }}>
            {/* Draw vertical lines for all parent levels */}
            {parentLevels.map((level) => {
              const lineLeft = (level - 1) * 20 + 10;
              const isLastChild = level === indentLevel;

              return (
                <div
                  key={level}
                  className={isLastChild ? styles.verticalLineWithConnector : styles.verticalLineContinuous}
                  style={{ left: `${lineLeft}px` }}
                />
              );
            })}

            {hasChildren && (
              <Button
                variant="secondary"
                size="sm"
                fill="text"
                onClick={() => toggleSpanCollapse(span.spanID)}
                className={styles.collapseButton}
              >
                <Icon name={isCollapsed ? 'angle-right' : 'angle-down'} />
              </Button>
            )}
            <div className={styles.spanName}>
              <div className={styles.serviceName}>{span.process.serviceName}</div>
              <div className={styles.operationName}>{span.operationName}</div>
            </div>
          </div>
          <div className={styles.spanTiming}>
            <span className={styles.duration}>{formatDuration(span.duration)}</span>
            <span className={styles.relativeTime}>{formatDuration(span.relativeStartTime)}</span>
          </div>
        </div>

        <div className={styles.spanTimeline}>
          <div
            className={styles.spanBar}
            style={{
              left: `${getSpanOffset(span)}%`,
              width: `${getSpanWidth(span)}%`,
            }}
            onClick={() => onSpanClick?.(span)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Timeline Ruler */}
      {renderTimelineRuler()}

      {/* Service & Operation Header */}
      <div className={styles.columnHeaders}>
        <div className={styles.serviceHeader}>Service & Operation</div>
        <div className={styles.timelineHeader}>Timeline</div>
      </div>

      {/* Spans */}
      <div className={styles.spansContainer}>{getVisibleSpans().map((span, index) => renderSpan(span, index))}</div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    background: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
  }),

  traceHeader: css({
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.colors.border.medium}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),

  traceName: css({
    margin: 0,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
  }),

  traceMetadata: css({
    display: 'flex',
    gap: theme.spacing(2),
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),

  traceDuration: css({
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.primary,
  }),

  spanCount: css({}),

  serviceCount: css({}),

  timelineRulerContainer: css({
    display: 'flex',
    borderBottom: `1px solid ${theme.colors.border.medium}`,
  }),

  timelineRulerSpacer: css({
    flex: 1,
    minWidth: '200px',
  }),

  timelineRuler: css({
    flex: 2,
    position: 'relative',
    height: '24px',
    fontSize: '11px',
    color: theme.colors.text.secondary,
    padding: theme.spacing(0.5, 1),
  }),

  timelineMarker: css({
    position: 'absolute',
    top: '4px',
    transform: 'translateX(-50%)',
    fontSize: '10px',
  }),

  columnHeaders: css({
    display: 'flex',
    padding: theme.spacing(1, 2),
    fontSize: '11px',
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
  }),

  serviceHeader: css({
    flex: 1,
    minWidth: '200px',
  }),

  timelineHeader: css({
    flex: 2,
    textAlign: 'center',
  }),

  spansContainer: css({
    maxHeight: '1000px',
    overflowY: 'auto',
  }),

  spanRow: css({
    display: 'flex',
    position: 'relative',
    '&:hover': {
      backgroundColor: theme.colors.background.secondary,
    },
  }),

  spanInfo: css({
    flex: 1,
    minWidth: '200px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
  }),

  spanDetails: css({
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  }),

  collapseButton: css({
    marginRight: theme.spacing(1),
    minWidth: 'auto',
    padding: theme.spacing(0.25),
  }),

  verticalLineContinuous: css({
    position: 'absolute',
    top: '0',
    bottom: '0',
    width: '1px',
    backgroundColor: theme.colors.border.medium,
  }),

  verticalLineWithConnector: css({
    position: 'absolute',
    top: '0',
    bottom: '0',
    width: '1px',
    backgroundColor: theme.colors.border.medium,
  }),

  spanName: css({
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),

  serviceName: css({
    fontSize: '11px',
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeightMedium,
  }),

  operationName: css({
    fontSize: '12px',
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeightRegular,
    wordBreak: 'break-word',
    lineHeight: '1.2',
  }),

  spanTiming: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    fontSize: '11px',
    minWidth: '70px',
    flexShrink: 0,
  }),

  duration: css({
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeightMedium,
  }),

  relativeTime: css({
    color: theme.colors.text.secondary,
  }),

  spanTimeline: css({
    flex: 2,
    position: 'relative',
    height: '32px',
    padding: theme.spacing(0.5, 1),
  }),

  spanBar: css({
    height: '20px',
    backgroundColor: theme.colors.primary.main,
    borderRadius: '2px',
    position: 'absolute',
    top: '6px',
    cursor: 'pointer',
    minWidth: '2px',
    '&:hover': {
      backgroundColor: theme.colors.primary.shade,
    },
  }),
});
