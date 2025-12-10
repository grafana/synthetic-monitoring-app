import { HCL_CONFIG } from './hclConfig';
import { HclValue, HclWriterInterface } from './hclTypes';
import { isHclArray, isHclObject } from './hclUtils';

export class HclWriter implements HclWriterInterface {
  constructor(
    public readonly indentLevel = 0,
    public readonly indentSize = HCL_CONFIG.INDENT_SIZE
  ) {}

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

  // Formats a value into HCL object syntax.
  private formatObject(value: HclValue, multiline: boolean): string {
    if (!isHclObject(value)) {
      return String(value);
    }

    const entries = Object.entries(value)
      .filter(([, val]) => val != null)
      .map(([key, val]) => `${key} = ${this.writeValue(val)}`);

    if (!multiline) {
      return `{ ${entries.join(', ')} }`;
    }

    // Multi-line format with proper indentation
    const child = this.child();
    const innerIndent = child.child().indent(); // Indent for object fields
    const outerIndent = child.indent(); // Indent for closing brace

    const formatted = entries.map((e) => `\n${innerIndent}${e}`).join('');

    return `{${formatted}\n${outerIndent}}`;
  }

  // Formats an array of objects as multi-line HCL array. (e.g. [{ key = value }, { key2 = value2 }])
  private writeObjectArray(value: Array<Record<string, any>>): string {
    const child = this.child();
    const items = value.map((item) => `\n${child.indent()}${this.formatObject(item, true)}`);
    return `[${items.join(',')}\n${this.indent()}]`;
  }

  // Formats an array of primitives as inline HCL array. (e.g. [1, "a", true])
  private writePrimitiveArray(value: HclValue[]): string {
    const items = value.map((item) => this.writeValue(item));
    return `[${items.join(', ')}]`;
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
      const isObjectArray = value.length > 0 && isHclObject(value[0]);
      return isObjectArray
        ? this.writeObjectArray(value as Array<Record<string, any>>)
        : this.writePrimitiveArray(value);
    }

    if (isHclObject(value)) {
      return this.formatObject(value, false);
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
