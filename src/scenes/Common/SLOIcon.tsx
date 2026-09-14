import React from 'react';
import { config } from '@grafana/runtime';
import { css, cx } from '@emotion/css';

const GRAFANA_SLO_PLUGIN_ID = 'grafana-slo-app';

/** @grafana/ui `Button` merges a `size` prop (sm/md/lg) onto icons — avoid that name collision. */
export type SLOIconProps = {
  /** Width and height in pixels. Ignores `Button`'s unrelated `size` prop when used as `icon={...}`. */
  pixelSize?: number;
  className?: string;
};

function imgStyle(pixelSize: number) {
  return css({
    width: `${pixelSize}px`,
    height: `${pixelSize}px`,
    maxWidth: `${pixelSize}px`,
    maxHeight: `${pixelSize}px`,
    objectFit: 'contain',
    flexShrink: 0,
    display: 'block',
    boxSizing: 'border-box',
  });
}

/**
 * Grafana SLO app branding from the installed plugin's static assets (no hardcoded CDN version).
 */
export function SLOIcon({ pixelSize = 16, className }: SLOIconProps) {
  const src = `${config.appSubUrl ?? ''}/public/plugins/${GRAFANA_SLO_PLUGIN_ID}/img/logo.svg`;
  return <img src={src} alt="" className={cx(imgStyle(pixelSize), className)} />;
}
