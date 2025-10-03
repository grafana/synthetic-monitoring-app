import { HclValue, HclWriterInterface } from '../core/hclTypes';
import { isEmptyArray, isEmptyObject,renderFieldAsBlock, shouldRenderAsBlock } from '../core/hclUtils';

export function formatSettingsToHcl(
  settings: Record<string, HclValue>,
  writer: HclWriterInterface,
  specialHandlers?: Record<string, (value: HclValue, writer: HclWriterInterface) => string[]>
): string[] {
  const lines: string[] = [];
  const childWriter = writer.child();

  Object.entries(settings).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    
    if (specialHandlers && specialHandlers[key]) {
      lines.push(...specialHandlers[key](value, childWriter));
      return;
    }

    if (shouldRenderAsBlock(key, value)) {
      if (isEmptyArray(value) || isEmptyObject(value)) {
        return;
      }
      lines.push(...renderFieldAsBlock(key, value, childWriter));
      return;
    }

    lines.push(childWriter.writeArgument(key, value as HclValue));
  });

  return lines;
}
