import React, { useEffect, useRef, useState } from 'react';
import {
  DataFrame,
  dateTime,
  dateTimeFormat,
  FieldColorModeId,
  FieldSparkline,
  FieldType,
  GrafanaTheme2,
  TimeRange,
} from '@grafana/data';
import { GraphDrawStyle, VisibilityMode } from '@grafana/schema';
import { Button, Icon, IconName, LinkButton, LoadingBar, Sparkline, Text, useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { useRecommendationTelemetry } from '../data';
import { getEvidenceExploreUrl } from '../evidence';
import { ReliabilityOpportunity } from '../model';
import { hasAggregateEvidence } from '../ReliabilityInboxPage.utils';
interface RecommendationEvidenceProps {
  opportunity: ReliabilityOpportunity;
  headerContent: React.ReactNode;
}

export function RecommendationEvidence({ opportunity, headerContent }: RecommendationEvidenceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = useStyles2(getStyles);
  const evidenceExploreUrl = getEvidenceExploreUrl(opportunity.suggestion.evidence);
  const showAggregateEvidence = hasAggregateEvidence(opportunity);
  const queryTimeRange = opportunity.suggestion.evidence.provenance?.range;
  const telemetry = useRecommendationTelemetry(opportunity.suggestion.evidence, isExpanded);

  return (
    <>
      <header className={styles.header}>
        {headerContent}
        <div className={styles.summary}>
          <div className={styles.hook}>
            <span className={styles.hookIcon}>
              <Icon name="chart-line" size="md" />
            </span>
            <p className={styles.hookText} id="reliability-inbox-recommendation-hook">
              {opportunity.requestVolume ? (
                <>
                  <span className={styles.hookMetric}>{opportunity.requestVolume} requests</span> reached this endpoint
                  during a one hour period, but no matching uptime check was found.
                </>
              ) : (
                'Recent traffic reached this endpoint, but no matching uptime check was found.'
              )}
            </p>
          </div>
          <Button
            aria-controls="reliability-inbox-recommendation-evidence"
            aria-expanded={isExpanded}
            className={styles.whyButton}
            fill="outline"
            icon="info-circle"
            size="sm"
            variant="secondary"
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            <span className={styles.whyButtonLabel}>
              Why this check?
              <Icon name={isExpanded ? 'angle-up' : 'angle-down'} size="sm" />
            </span>
          </Button>
        </div>
      </header>

      {isExpanded && (
        <div className={styles.evidence} id="reliability-inbox-recommendation-evidence" role="region">
          <div className={styles.coverageAssessment}>
            <span className={styles.coverageIcon}>
              <Icon name="shield" />
            </span>
            <div className={styles.coverageCopy}>
              <Text element="h3" variant="h4" weight="medium">
                No matching uptime check was found
              </Text>
              <Text element="p" color="secondary">
                We looked for an existing HTTP check with the same hostname and URL path among the checks available to
                us. Aliases, redirects, upstream checks, and inaccessible monitoring may not be represented.
              </Text>

              {showAggregateEvidence ? (
                <>
                  <div className={styles.telemetryGrid}>
                    <EvidenceMetric
                      icon="chart-line"
                      label="Request activity"
                      value={opportunity.requestVolume}
                      context={opportunity.requestRate ? `${opportunity.requestRate} average` : undefined}
                      color="blue"
                      tone="info"
                      isLoading={telemetry.isLoading || telemetry.isFetching}
                      queryTimeRange={queryTimeRange}
                      sparkline={selectTrendSparkline(telemetry.data, 'A')}
                    />
                    <EvidenceMetric
                      icon="exclamation-triangle"
                      label="5xx responses"
                      value={opportunity.errorRate}
                      color="red"
                      tone="error"
                      isLoading={telemetry.isLoading || telemetry.isFetching}
                      queryTimeRange={queryTimeRange}
                      sparkline={selectTrendSparkline(telemetry.data, 'B')}
                    />
                    <EvidenceMetric
                      icon="clock-nine"
                      label="p99 response time"
                      value={opportunity.p99}
                      color="purple"
                      tone="accent"
                      isLoading={telemetry.isLoading || telemetry.isFetching}
                      queryTimeRange={queryTimeRange}
                      sparkline={selectTrendSparkline(telemetry.data, 'C')}
                    />
                  </div>

                  <div className={styles.whyFooter}>
                    {evidenceExploreUrl && (
                      <LinkButton href={evidenceExploreUrl} icon="compass" variant="secondary">
                        Open in Explore
                      </LinkButton>
                    )}
                  </div>
                </>
              ) : (
                <Text element="p" color="secondary" role="status">
                  No aggregate traffic values were returned for this suggestion.
                </Text>
              )}
            </div>
          </div>

          {telemetry.isError && (
            <Text variant="bodySmall" color="secondary">
              Inline trends are unavailable. Open in Explore to inspect the source queries.
            </Text>
          )}
        </div>
      )}
    </>
  );
}

function EvidenceMetric({
  icon,
  label,
  value,
  context,
  color,
  tone,
  isLoading,
  queryTimeRange,
  sparkline,
}: {
  icon: IconName;
  label: string;
  value?: string;
  context?: string;
  color: string;
  tone: 'info' | 'error' | 'accent';
  isLoading: boolean;
  queryTimeRange?: { from: string; to: string };
  sparkline?: FieldSparkline;
}) {
  const styles = useStyles2(getStyles);

  if (!value) {
    return null;
  }

  return (
    <div className={styles.metric}>
      <span className={cx(styles.metricLabel, styles[tone])}>
        <Icon name={icon} size="sm" />
        {label}
      </span>
      <div className={styles.metricValueRow}>
        <Text variant="h4" weight="medium">
          {value}
        </Text>
        {context && (
          <span className={styles.metricContext}>
            <Text variant="bodySmall" color="secondary">
              {context}
            </Text>
          </span>
        )}
      </div>
      <InlineSparkline
        color={color}
        isLoading={isLoading}
        queryTimeRange={queryTimeRange}
        sparkline={sparkline}
        label={`${label} trend`}
      />
    </div>
  );
}

function InlineSparkline({
  color,
  isLoading,
  queryTimeRange,
  sparkline,
  label,
}: {
  color: string;
  isLoading: boolean;
  queryTimeRange?: { from: string; to: string };
  sparkline?: FieldSparkline;
  label: string;
}) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const timeAxisLabels = getTimeAxisLabels(queryTimeRange, sparkline?.timeRange);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    let initialMeasurementFrame: number | undefined;
    const measureUntilReady = () => {
      const measuredWidth = Math.floor(element.getBoundingClientRect().width);

      if (measuredWidth > 0) {
        setWidth(measuredWidth);
        initialMeasurementFrame = undefined;
        return;
      }

      initialMeasurementFrame = requestAnimationFrame(measureUntilReady);
    };

    measureUntilReady();

    const observer = new ResizeObserver((entries) => {
      const measuredWidth = Math.floor(entries[0]?.contentRect.width ?? 0);

      if (measuredWidth > 0) {
        setWidth(measuredWidth);

        if (initialMeasurementFrame !== undefined) {
          cancelAnimationFrame(initialMeasurementFrame);
          initialMeasurementFrame = undefined;
        }
      }
    });

    observer.observe(element);

    return () => {
      if (initialMeasurementFrame !== undefined) {
        cancelAnimationFrame(initialMeasurementFrame);
      }

      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.sparkline}>
      {isLoading && (
        <div className={styles.loadingBar}>
          <LoadingBar width={Math.max(width, 1)} delay={0} ariaLabel={`Loading ${label.toLocaleLowerCase()}`} />
        </div>
      )}
      <div className={styles.plot}>
        {sparkline && (
          <div role="img" aria-label={label}>
            {width > 0 && (
              <Sparkline
                config={{
                  color: { mode: FieldColorModeId.Fixed, fixedColor: color },
                  custom: {
                    drawStyle: GraphDrawStyle.Line,
                    fillOpacity: 20,
                    lineWidth: 1.5,
                    showPoints: VisibilityMode.Never,
                  },
                }}
                height={72}
                sparkline={sparkline}
                theme={theme}
                width={width}
              />
            )}
          </div>
        )}
      </div>
      {timeAxisLabels && (
        <div className={styles.timeAxis} aria-hidden="true">
          <span>{timeAxisLabels.from}</span>
          <span>{timeAxisLabels.to}</span>
        </div>
      )}
    </div>
  );
}

function getTimeAxisLabels(queryRange: { from: string; to: string } | undefined, sparklineRange?: TimeRange) {
  const queryFrom = Number(queryRange?.from);
  const queryTo = Number(queryRange?.to);
  const hasValidQueryRange = Number.isFinite(queryFrom) && Number.isFinite(queryTo) && queryFrom < queryTo;
  const from = hasValidQueryRange ? queryFrom : sparklineRange?.from.valueOf();
  const to = hasValidQueryRange ? queryTo : sparklineRange?.to.valueOf();

  if (!Number.isFinite(from) || !Number.isFinite(to) || from === undefined || to === undefined || from >= to) {
    return undefined;
  }

  return {
    from: dateTimeFormat(from, { format: 'HH:mm' }),
    to: dateTimeFormat(to, { format: 'HH:mm' }),
  };
}

export function selectTrendSparkline(frames: DataFrame[] | undefined, refId: string) {
  const frame = frames
    ?.filter((frame) => frame.refId === refId)
    .map((frame) => ({ frame, pointCount: countRenderablePoints(frame) }))
    .filter(({ pointCount }) => pointCount > 1)
    .sort((left, right) => right.pointCount - left.pointCount)[0]?.frame;

  if (!frame) {
    return undefined;
  }

  const x = frame.fields.find((field) => field.type === FieldType.time);
  const numberField = frame.fields.find((field) => field.type === FieldType.number);

  if (!x || !numberField) {
    return undefined;
  }

  const finiteValues = Array.from(numberField.values)
    .map(Number)
    .filter((value) => Number.isFinite(value));
  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);
  const y = {
    ...numberField,
    state: {
      ...numberField.state,
      range: { min, max, delta: max - min },
    },
  };

  return { x, y, timeRange: getFrameTimeRange(x.values) };
}

function countRenderablePoints(frame: DataFrame) {
  const x = frame.fields.find((field) => field.type === FieldType.time);
  const y = frame.fields.find((field) => field.type === FieldType.number);
  const length = Math.min(x?.values.length ?? 0, y?.values.length ?? 0);
  let pointCount = 0;

  for (let index = 0; index < length; index += 1) {
    if (Number.isFinite(Number(x?.values[index])) && Number.isFinite(Number(y?.values[index]))) {
      pointCount += 1;
    }
  }

  return pointCount;
}

function getFrameTimeRange(timeValues: ArrayLike<unknown>): TimeRange | undefined {
  const from = Number(timeValues[0]);
  const to = Number(timeValues[timeValues.length - 1]);

  if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to) {
    return undefined;
  }

  const fromTime = dateTime(from);
  const toTime = dateTime(to);

  return { from: fromTime, to: toTime, raw: { from: fromTime, to: toTime } };
}

const getStyles = (theme: GrafanaTheme2) => {
  const atSm = `@container suggestedCheck (min-width: ${theme.breakpoints.values.sm}px)`;

  return {
    header: css({
      background: theme.colors.background.secondary,
      borderBottom: `1px solid ${theme.colors.border.medium}`,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1.5),
      padding: theme.spacing(2, 2.5),
    }),
    summary: css({
      alignItems: 'flex-start',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      justifyContent: 'space-between',
      [atSm]: {
        alignItems: 'center',
        flexDirection: 'row',
      },
    }),
    hook: css({
      alignItems: 'center',
      display: 'flex',
      flex: '1 1 auto',
      gap: theme.spacing(1),
      minWidth: 0,
      [atSm]: {
        flex: '1 1 440px',
      },
    }),
    hookIcon: css({
      alignItems: 'center',
      background: theme.colors.info.transparent,
      borderRadius: '50%',
      color: theme.colors.info.text,
      display: 'inline-flex',
      flex: '0 0 auto',
      height: theme.spacing(4),
      justifyContent: 'center',
      width: theme.spacing(4),
    }),
    hookText: css({ margin: 0 }),
    hookMetric: css({ fontWeight: theme.typography.fontWeightMedium }),
    whyButton: css({
      background: theme.colors.info.transparent,
      borderColor: theme.colors.info.border,
      color: theme.colors.info.text,
      flex: '0 0 auto',
      '&:hover, &:focus': {
        background: theme.colors.action.hover,
        borderColor: theme.colors.info.text,
        color: theme.colors.info.text,
      },
    }),
    whyButtonLabel: css({
      alignItems: 'center',
      display: 'inline-flex',
      gap: theme.spacing(0.75),
      whiteSpace: 'nowrap',
    }),
    evidence: css({
      background: theme.colors.background.secondary,
      borderBottom: `1px solid ${theme.colors.border.medium}`,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
      padding: theme.spacing(2, 2.5, 2.5),
    }),
    whyFooter: css({
      display: 'flex',
      justifyContent: 'flex-end',
    }),
    telemetryGrid: css({
      display: 'grid',
      gap: theme.spacing(2),
      gridTemplateColumns: '1fr',
      [atSm]: {
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        '& > div + div': {
          borderLeft: `1px solid ${theme.colors.border.weak}`,
          paddingLeft: theme.spacing(2),
        },
      },
    }),
    metric: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
      minWidth: 0,
    }),
    metricLabel: css({
      alignItems: 'center',
      display: 'flex',
      fontSize: theme.typography.bodySmall.fontSize,
      gap: theme.spacing(0.75),
    }),
    metricValueRow: css({
      alignItems: 'baseline',
      display: 'flex',
      gap: theme.spacing(1),
      justifyContent: 'space-between',
      minWidth: 0,
    }),
    metricContext: css({
      marginLeft: 'auto',
      textAlign: 'right',
    }),
    info: css({ color: theme.colors.info.text }),
    error: css({ color: theme.colors.error.text }),
    accent: css({ color: theme.visualization.getColorByName('purple') }),
    sparkline: css({
      display: 'grid',
      gridTemplateRows: '72px auto',
      height: 108,
      marginTop: 'auto',
      minWidth: 0,
      paddingTop: theme.spacing(1.5),
      position: 'relative',
      width: '100%',
    }),
    plot: css({
      height: 72,
      minHeight: 72,
    }),
    loadingBar: css({
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    }),
    timeAxis: css({
      color: theme.colors.text.secondary,
      display: 'flex',
      fontSize: theme.typography.bodySmall.fontSize,
      justifyContent: 'space-between',
      marginTop: theme.spacing(0.5),
    }),
    coverageAssessment: css({
      display: 'grid',
      gap: theme.spacing(1.5),
      gridTemplateColumns: `${theme.spacing(4)} minmax(0, 1fr)`,
    }),
    coverageIcon: css({
      alignItems: 'center',
      alignSelf: 'start',
      background: theme.colors.success.transparent,
      borderRadius: '50%',
      color: theme.colors.success.text,
      display: 'inline-flex',
      height: theme.spacing(4),
      justifyContent: 'center',
      width: theme.spacing(4),
    }),
    coverageCopy: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
      minWidth: 0,
    }),
  };
};
