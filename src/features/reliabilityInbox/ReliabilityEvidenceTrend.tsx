import React, { PropsWithChildren, useEffect, useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { SceneDataNode, SceneTimeRange, VizConfigBuilders } from '@grafana/scenes';
import { SceneContext, SceneContextObject, VizPanel } from '@grafana/scenes-react';
import {
  AxisColorMode,
  AxisPlacement,
  GraphDrawStyle,
  GraphGradientMode,
  LegendDisplayMode,
  LineInterpolation,
  ScaleDistribution,
  SortOrder,
  StackingMode,
  TooltipDisplayMode,
  VisibilityMode,
} from '@grafana/schema';
import { Spinner, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ReliabilityEvidencePrototype } from './types';

import { getEvidenceExploreUrl, getEvidencePanelData } from './evidence';

interface ReliabilityEvidenceTrendProps {
  evidence: ReliabilityEvidencePrototype;
  isLoading?: boolean;
}

export function ReliabilityEvidenceTrend({ evidence, isLoading = false }: ReliabilityEvidenceTrendProps) {
  const styles = useStyles2(getStyles);
  const panelData = useMemo(() => getEvidencePanelData(evidence), [evidence]);
  const dataProvider = useMemo(() => new SceneDataNode({ data: panelData }), [panelData]);
  const exploreUrl = getEvidenceExploreUrl(evidence, config.bootData.user.orgId);

  if (isLoading) {
    return (
      <div className={styles.state} role="status">
        <Spinner size="sm" />
        <span>Loading traffic trend…</span>
      </div>
    );
  }

  if (evidence.timeline.length === 0) {
    return (
      <div className={styles.state} role="status">
        No traffic trend is available for this evidence window.
      </div>
    );
  }

  return (
    <div className={styles.trend}>
      <div className={styles.trendHeader}>
        <span>Observed traffic trend</span>
        {exploreUrl && (
          <TextLink href={exploreUrl} variant="bodySmall">
            View in Explore
          </TextLink>
        )}
      </div>
      <div className={styles.panel} aria-label="Observed requests over time">
        <StaticSceneContext from={evidence.window.from} to={evidence.window.to}>
          <VizPanel dataProvider={dataProvider} title="" viz={trafficTrendViz} />
        </StaticSceneContext>
      </div>
    </div>
  );
}

function StaticSceneContext({ children, from, to }: PropsWithChildren<{ from: number; to: number }>) {
  const scene = useMemo(
    () =>
      new SceneContextObject({
        children: [],
        $timeRange: new SceneTimeRange({ from: String(from), to: String(to) }),
      }),
    [from, to]
  );

  useEffect(() => scene.activate(), [scene]);

  return <SceneContext.Provider value={scene}>{children}</SceneContext.Provider>;
}

const trafficTrendViz = VizConfigBuilders.timeseries()
  .setUnit('short')
  .setMin(0)
  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
  .setCustomFieldConfig('lineInterpolation', LineInterpolation.Smooth)
  .setCustomFieldConfig('barAlignment', 0)
  .setCustomFieldConfig('lineWidth', 2)
  .setCustomFieldConfig('fillOpacity', 14)
  .setCustomFieldConfig('gradientMode', GraphGradientMode.Opacity)
  .setCustomFieldConfig('spanNulls', false)
  .setCustomFieldConfig('insertNulls', false)
  .setCustomFieldConfig('showPoints', VisibilityMode.Never)
  .setCustomFieldConfig('pointSize', 4)
  .setCustomFieldConfig('stacking', { mode: StackingMode.None, group: 'A' })
  .setCustomFieldConfig('axisPlacement', AxisPlacement.Auto)
  .setCustomFieldConfig('axisLabel', '')
  .setCustomFieldConfig('axisColorMode', AxisColorMode.Text)
  .setCustomFieldConfig('axisBorderShow', false)
  .setCustomFieldConfig('scaleDistribution', { type: ScaleDistribution.Linear })
  .setCustomFieldConfig('axisCenteredZero', false)
  .setCustomFieldConfig('hideFrom', { tooltip: false, viz: false, legend: true })
  .setOption('tooltip', { mode: TooltipDisplayMode.Single, sort: SortOrder.None })
  .setOption('legend', {
    showLegend: false,
    displayMode: LegendDisplayMode.List,
    placement: 'bottom',
    calcs: [],
  })
  .setColor({ mode: 'palette-classic' })
  .build();

const getStyles = (theme: GrafanaTheme2) => ({
  trend: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.secondary,
    overflow: 'hidden',
  }),
  trendHeader: css({
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    minHeight: theme.spacing(4),
    padding: theme.spacing(0.75, 1.5),
    '& > span': {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
    },
  }),
  panel: css({
    height: 180,
  }),
  state: css({
    alignItems: 'center',
    background: theme.colors.background.secondary,
    border: `1px dashed ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    color: theme.colors.text.secondary,
    display: 'flex',
    gap: theme.spacing(1),
    justifyContent: 'center',
    minHeight: 180,
    padding: theme.spacing(2),
    textAlign: 'center',
  }),
});
