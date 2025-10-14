import { FormatterFunction, HclValue, HclWriterInterface } from './hcl/core/hclTypes';
import { HclWriter } from './hcl/core/HclWriter';
import { formatGrpcSettingsToHcl } from './hcl/formatters/grpcFormatter';
import { formatMultiHttpSettingsToHcl } from './hcl/formatters/multiHttpFormatter';
import { formatSimpleSettingsToHcl } from './hcl/formatters/simpleFormatter';
import { renderProviderBlocks, renderResourceBlocks,renderTerraformBlock } from './hcl/terraformRenderer';
import { TFConfig } from './terraformTypes';

const SETTINGS_FORMATTERS: Record<string, FormatterFunction> = {
  multihttp: formatMultiHttpSettingsToHcl,
  grpc: formatGrpcSettingsToHcl,
  scripted: formatSimpleSettingsToHcl,
  browser: formatSimpleSettingsToHcl,
  // Default formatter for simple types (http, dns, tcp, ping, traceroute)
  default: formatSimpleSettingsToHcl,
};

const formatCheckSettings = (settingsType: string, settings: Record<string, HclValue>, writer: HclWriterInterface): string[] => {
  const formatter = SETTINGS_FORMATTERS[settingsType] || SETTINGS_FORMATTERS.default;
  return formatter(settings, writer);
};

export function jsonToHcl(config: TFConfig): string {
  const writer = new HclWriter();
  const lines: string[] = [];

  // Render terraform block
  lines.push(...renderTerraformBlock(config, writer));

  // Add spacing between blocks
  if (lines.length > 0) {
    lines.push('');
  }

  // Render provider blocks
  const providerLines = renderProviderBlocks(config, writer);
  if (providerLines.length > 0) {
    lines.push(...providerLines);
    lines.push('');
  }

  // Render resource blocks
  const resourceLines = renderResourceBlocks(config, writer, formatCheckSettings);
  if (resourceLines.length > 0) {
    lines.push(...resourceLines);
  }

  return lines.join('\n');
}
