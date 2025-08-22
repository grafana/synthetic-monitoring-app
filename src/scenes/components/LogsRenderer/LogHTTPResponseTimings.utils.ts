export function getTiming(start: string, end: string) {
  const startTime = parseGoTimestampToMilliseconds(start);
  const endTime = parseGoTimestampToMilliseconds(end);

  return endTime - startTime;
}

function parseGoTimestampToMilliseconds(timestamp: string): number {
  // Split the timestamp to get the fractional seconds part
  const [dateTimePart, rest = ''] = timestamp.split('.');
  const [fractionalPart = '0'] = rest.split(' ');

  // Get the base time in milliseconds
  const baseTime = new Date(dateTimePart + 'Z').getTime();

  // Convert fractional seconds to milliseconds
  // Pad or truncate to 9 digits (nanoseconds), then convert to milliseconds
  const paddedFractional = fractionalPart.padEnd(9, '0').substring(0, 9);
  const nanoseconds = parseInt(paddedFractional, 10);
  const milliseconds = nanoseconds / 1000000;

  return baseTime + milliseconds;
}

export function getSeconds(string: string) {
  return Math.floor(new Date(string).getTime() / 1000);
}

export function getMilliseconds(string: string) {
  const [_dateTimeUpToSeconds, rest = ``] = string.split('.');
  const [nanoSeconds = `0`] = rest.split(' ');

  return Number(nanoSeconds) / 1000000;
}
