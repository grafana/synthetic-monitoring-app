import { HclValue, HclWriterInterface } from '../core/hclTypes';
import { formatSettingsToHcl } from './baseFormatter';

export function formatSimpleSettingsToHcl(
  settings: Record<string, HclValue>,
  writer: HclWriterInterface
): string[] {
  // Simple formatters for http, dns, tcp, ping, traceroute, scripted, browser
  return formatSettingsToHcl(settings, writer);
}
