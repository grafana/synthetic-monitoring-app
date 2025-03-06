export function formatUptime(uptime: string | null) {
  if (uptime === null) {
    return 'Waiting...';
  }

  return `${uptime}%`;
}

// 0.00071 = 710µs
// 0.071 = 71ms
// 0.71 = 710ms
// 7.1 = 7.1s
// 71 = 71s
// 710 = 11.83m

export function formatDuration(duration: number | null) {
  if (duration === null) {
    return 'Waiting...';
  }

  const durationInMs = Math.round(duration * 1000);

  if (durationInMs < 1000) {
    return `${durationInMs}ms`;
  }

  const durationInSeconds = Math.round(durationInMs / 1000);

  if (durationInSeconds < 60) {
    return `${durationInSeconds}s`;
  }

  const durationInMinutes = durationInSeconds / 60;
  const remainingSeconds = durationInSeconds % 60;

  return `${durationInMinutes}m ${remainingSeconds}s`;
}
