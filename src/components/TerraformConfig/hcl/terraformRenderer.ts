import { TFCheckAlerts, TFCheckSettings, TFConfig, TFLabels } from '../terraformTypes';
import { HclValue, HclWriterInterface } from './core/hclTypes';

export function renderTerraformBlock(config: TFConfig, writer: HclWriterInterface): string[] {
  const lines: string[] = [];

  if (config.terraform?.required_providers) {
    const terraformLines: string[] = [];
    const terraformWriter = writer.child();

    const requiredProvidersLines: string[] = [];
    const providersWriter = terraformWriter.child();

    Object.entries(config.terraform.required_providers).forEach(([providerName, providerConfig]) => {
      if (typeof providerConfig === 'object' && providerConfig !== null) {
        const configEntries = Object.entries(providerConfig)
          .filter(([_, value]) => value !== null && value !== undefined)
          .map(([key, value]) => `${key} = ${writer.writeValue(value)}`);

        if (configEntries.length > 0) {
          requiredProvidersLines.push(`${providersWriter.indent()}${providerName} = { ${configEntries.join(', ')} }`);
        }
      }
    });

    if (requiredProvidersLines.length > 0) {
      terraformLines.push(...terraformWriter.writeBlock('required_providers', requiredProvidersLines));
    }

    if (terraformLines.length > 0) {
      lines.push(...writer.writeBlock('terraform', terraformLines));
    }
  }

  return lines;
}

export function renderProviderBlocks(config: TFConfig, writer: HclWriterInterface): string[] {
  if (!config.provider) {
    return [];
  }

  const lines: string[] = [];

  Object.entries(config.provider).forEach(([providerName, providerConfig]) => {
    if (providerConfig && typeof providerConfig === 'object') {
      const providerLines: string[] = [];
      const providerWriter = writer.child();

      Object.entries(providerConfig).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          providerLines.push(providerWriter.writeArgument(key, value as HclValue));
        }
      });

      if (providerLines.length > 0) {
        lines.push(...writer.writeBlock(`provider "${providerName}"`, providerLines));
      }
    }
  });

  return lines;
}

export function renderResourceLabels(labels: TFLabels, writer: HclWriterInterface): string[] {
  const entries = Object.entries(labels).filter(([_, value]) => value !== null && value !== undefined);

  if (entries.length === 0) {
    return [];
  }

  const labelsObject: Record<string, HclValue> = {};
  entries.forEach(([key, value]) => {
    labelsObject[key] = value as HclValue;
  });

  return [writer.writeArgument('labels', labelsObject)];
}

export function renderResourceAlerts(alerts: TFCheckAlerts['alerts'], writer: HclWriterInterface): string[] {
  const lines: string[] = [];

  alerts.forEach((alert) => {
    const alertLines: string[] = [];
    const alertWriter = writer.child();

    Object.entries(alert).forEach(([alertKey, alertValue]) => {
      if (alertValue !== null && alertValue !== undefined) {
        alertLines.push(alertWriter.writeArgument(alertKey, alertValue as HclValue));
      }
    });

    if (alertLines.length > 0) {
      lines.push(...writer.writeBlock('alerts', alertLines));
    }
  });

  return lines;
}

export function renderSingleResource(
  resourceType: string,
  resourceName: string,
  resourceConfig: Record<string, any>,
  writer: HclWriterInterface,
  formatCheckSettings: (settingsType: string, settings: Record<string, HclValue>, writer: HclWriterInterface) => string[]
): string[] {
  const resourceLines: string[] = [];
  const resourceWriter = writer.child();

  const fieldHandlers = {
    settings: (value: TFCheckSettings) => {
      const settingsLines: string[] = [];
      const settingsWriter = resourceWriter.child();
      
      Object.entries(value).forEach(([settingsType, settingsValue]) => {
        if (!settingsValue || typeof settingsValue !== 'object') {
          return;
        }
        const typeLines = formatCheckSettings(settingsType, settingsValue as Record<string, HclValue>, settingsWriter.child());
        if (typeLines.length > 0) {
          settingsLines.push(...settingsWriter.writeBlock(settingsType, typeLines));
        }
      });
      
      return settingsLines.length > 0 ? resourceWriter.writeBlock('settings', settingsLines) : [];
    },
    labels: (value: TFLabels) => renderResourceLabels(value, resourceWriter),
    alerts: (value: TFCheckAlerts['alerts']) => renderResourceAlerts(value, resourceWriter),
  };

  Object.entries(resourceConfig).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    const handler = fieldHandlers[key as keyof typeof fieldHandlers];
    if (handler) {
      resourceLines.push(...handler(value));
      return;
    }

    resourceLines.push(resourceWriter.writeArgument(key, value as HclValue));
  });

  return resourceLines.length > 0
    ? writer.writeBlock(`resource "${resourceType}" "${resourceName}"`, resourceLines)
    : [];
}

export function renderResourceBlocks(
  config: TFConfig, 
  writer: HclWriterInterface,
  formatCheckSettings: (settingsType: string, settings: Record<string, HclValue>, writer: HclWriterInterface) => string[]
): string[] {
  if (!config.resource) {
    return [];
  }

  const lines: string[] = [];

  Object.entries(config.resource).forEach(([resourceType, resources]) => {
    if (resources && typeof resources === 'object') {
      Object.entries(resources).forEach(([resourceName, resourceConfig]) => {
        if (resourceConfig && typeof resourceConfig === 'object') {
          const resourceLines = renderSingleResource(resourceType, resourceName, resourceConfig, writer, formatCheckSettings);
          if (resourceLines.length > 0) {
            // Add the resource lines
            lines.push(...resourceLines);
            // Add a newline after each resource for better readability
            lines.push('');
          }
        }
      });
    }
  });

  // Remove the trailing empty line if it exists
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines;
}
