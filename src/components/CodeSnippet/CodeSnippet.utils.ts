const LINE_HEIGHT = 22;
const MIN_HEIGHT = 52;

export const getEstimatedHeight = (str = '') =>
  Math.max((str.trim().split('\n').length || 1) * LINE_HEIGHT, MIN_HEIGHT);

export function getTab<T extends { value: string }>(activeTab: string | undefined, tabs: T[] = []) {
  return tabs.find((tab) => tab.value === activeTab) || tabs[0];
}

export const identity = <T = unknown>(x: T) => x;

export const formatCode = (str: string) => {
  // join lines when there is a suppressed newline
  // handle escaped backticks
  let result = str.replace(/\\\n[ \t]*/g, '').replace(/\\`/g, '`');

  let minIndent: number | null = null;
  const lines = result.split('\n');

  // strip indentation
  lines.forEach((line) => {
    const match = line.match(/^(\s+)\S+/);

    if (match) {
      const indent = match[1]?.length ?? 0;

      if (!minIndent) {
        minIndent = indent;
      } else {
        minIndent = Math.min(minIndent, indent);
      }
    }
  });

  if (minIndent !== null) {
    result = lines.map((line) => (line[0] === ' ' ? line.slice(minIndent as number) : line)).join('\n');
  }

  return result.trim().replace(/\\n/g, '\n');
};
