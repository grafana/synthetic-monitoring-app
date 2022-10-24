import React from 'react';
import { PluginPageProps, PluginPage as RealPluginPage, config } from '@grafana/runtime';

export const PluginPage = RealPluginPage && config.featureToggles.topnav ? RealPluginPage : PluginPageFallback;

function PluginPageFallback(props: PluginPageProps) {
  return <div>{props.children}</div>;
}
