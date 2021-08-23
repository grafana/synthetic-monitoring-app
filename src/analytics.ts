const EVENT_CATEGORY = 'SyntheticMonitoring';

export function trackEvent(action: string, label?: string) {
  const trackGa = (window as any).ga;
  if (trackGa) {
    trackGa('event', 'send', EVENT_CATEGORY, action, label);
  } else {
    return;
  }
}

export function trackException(description: string, fatal?: boolean) {
  const trackGa = (window as any).ga;
  if (trackGa) {
    trackGa('send', {
      hitType: 'exception',
      eventCatgory: EVENT_CATEGORY,
      exDescription: description,
    });
  } else {
    return;
  }
}
