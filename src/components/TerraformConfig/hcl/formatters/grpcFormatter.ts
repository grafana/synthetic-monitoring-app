import { HclValue, HclWriterInterface } from '../core/hclTypes';
import { isHclObject } from '../core/hclUtils';
import { formatSettingsToHcl } from './baseFormatter';

export function formatGrpcSettingsToHcl(
  grpcSettings: Record<string, HclValue>,
  writer: HclWriterInterface
): string[] {
  const specialHandlers = {
    tls_config: (tlsConfig: HclValue, writer: HclWriterInterface) => {
      if (isHclObject(tlsConfig)) {
        const entries = Object.entries(tlsConfig).filter(([_, v]) => v !== null && v !== undefined);
        if (entries.length === 0) {
          return [];
        }

        const tlsLines: string[] = [];
        const tlsWriter = writer.child();

        entries.forEach(([tlsKey, tlsValue]) => {
          tlsLines.push(tlsWriter.writeArgument(tlsKey, tlsValue as HclValue));
        });

        return writer.writeBlock('tls_config', tlsLines);
      }
      return [];
    },
  };
  
  return formatSettingsToHcl(grpcSettings, writer, specialHandlers);
}
