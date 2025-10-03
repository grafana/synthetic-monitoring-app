export type HclValue = string | number | boolean | null | undefined | any[] | Record<string, any>;

export type FormatterFunction = (settings: Record<string, HclValue>, writer: HclWriterInterface) => string[];

export interface HclWriterInterface {
  readonly indentLevel: number;
  readonly indentSize: number;
  indent(): string;
  child(): HclWriterInterface;
  writeValue(value: HclValue): string;
  writeBlock(name: string, content: string[]): string[];
  writeArgument(key: string, value: HclValue): string;
}
