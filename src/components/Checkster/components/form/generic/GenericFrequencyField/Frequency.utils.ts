export function frequencyInSecondsAndMinutes(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);

  return { minutes, seconds };
}
