import { HCL_CONFIG } from './hclConfig';
import { HclValue, HclWriterInterface } from './hclTypes';
import { isHclArray, isHclObject } from './hclUtils';

export class HclWriter implements HclWriterInterface {
  constructor(public readonly indentLevel = 0, public readonly indentSize = HCL_CONFIG.INDENT_SIZE) {}

  indent(): string {
    return ' '.repeat(this.indentLevel * this.indentSize);
  }

  child(): HclWriterInterface {
    return new HclWriter(this.indentLevel + 1, this.indentSize);
  }

  private escapeHclString(str: string): string {
    return str
      .replace(/\\/g, HCL_CONFIG.ESCAPE_CHARS['\\'])
      .replace(/"/g, HCL_CONFIG.ESCAPE_CHARS['"'])
      .replace(/\n/g, HCL_CONFIG.ESCAPE_CHARS['\n'])
      .replace(/\r/g, HCL_CONFIG.ESCAPE_CHARS['\r'])
      .replace(/\t/g, HCL_CONFIG.ESCAPE_CHARS['\t'])
      .replace(/\$\{/g, HCL_CONFIG.ESCAPE_CHARS['${']);
  }

  writeValue(value: HclValue): string {
    if (value === null || value === undefined) {
      return 'null';
    }

    if (typeof value === 'string') {
      if (value.includes('\n')) {
        const escapedValue = value.replace(/\$\{/g, HCL_CONFIG.ESCAPE_CHARS['${']);
        return `<<EOF\n${escapedValue}\nEOF`;
      }
      return `"${this.escapeHclString(value)}"`;
    }

    if (typeof value === 'boolean') {
      return value.toString();
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (isHclArray(value)) {
      const items = value.map((item) => this.writeValue(item));
      return `[${items.join(', ')}]`;
    }

    if (isHclObject(value)) {
      const entries = Object.entries(value)
        .filter(([_, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `${k} = ${this.writeValue(v)}`);
      return `{ ${entries.join(', ')} }`;
    }

    return String(value);
  }

  writeBlock(name: string, content: string[]): string[] {
    if (content.length === 0) {
      return [];
    }

    const lines: string[] = [];
    lines.push(`${this.indent()}${name} {`);
    lines.push(...content);
    lines.push(`${this.indent()}}`);
    return lines;
  }

  writeArgument(key: string, value: HclValue): string {
    return `${this.indent()}${key} = ${this.writeValue(value)}`;
  }
}
