import { HCL_CONFIG } from './hclConfig';
import { HclValue, HclWriterInterface } from './hclTypes';

export function isHclObject(value: HclValue): value is Record<string, HclValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isHclArray(value: HclValue): value is HclValue[] {
  return Array.isArray(value);
}

export function isEmptyArray(value: HclValue): boolean {
  return isHclArray(value) && value.length === 0;
}

export function isEmptyObject(value: HclValue): boolean {
  return isHclObject(value) && Object.keys(value).length === 0;
}

export function shouldRenderAsBlock(key: string, value: HclValue): boolean {
  return HCL_CONFIG.BLOCK_FIELDS.has(key) && (isHclObject(value) || isHclArray(value));
}

export function renderFieldAsBlock(key: string, value: HclValue, writer: HclWriterInterface): string[] {
  const lines: string[] = [];

  if (isHclArray(value)) {
    value.forEach((item) => {
      if (isHclObject(item)) {
        const entries = Object.entries(item).filter(([_, v]) => v !== null && v !== undefined);
        if (entries.length === 0) {
          return;
        }

        const blockContent: string[] = [];
        const blockWriter = writer.child();

        entries.forEach(([objKey, objValue]) => {
          blockContent.push(blockWriter.writeArgument(objKey, objValue as HclValue));
        });

        if (blockContent.length > 0) {
          lines.push(...writer.writeBlock(key, blockContent));
        }
      }
    });
    return lines;
  }

  if (isHclObject(value)) {
    const entries = Object.entries(value).filter(([_, v]) => v !== null && v !== undefined);

    if (entries.length === 0) {
      return lines;
    }

    const blockContent: string[] = [];
    const blockWriter = writer.child();

    entries.forEach(([objKey, objValue]) => {
      blockContent.push(blockWriter.writeArgument(objKey, objValue as HclValue));
    });

    if (blockContent.length > 0) {
      lines.push(...writer.writeBlock(key, blockContent));
    }
  }

  return lines;
}
