import React from 'react';
import { config, PluginPage as RealPluginPage, PluginPageProps } from '@grafana/runtime';

export const PluginPage = RealPluginPage && config.featureToggles.topnav ? RealPluginPage : PluginPageFallback;

function PluginPageFallback(props: PluginPageProps) {
  return <div>{props.children}</div>;
}
