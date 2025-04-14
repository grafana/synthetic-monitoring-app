interface UseTimepointsInRangeProps {
  from: Date;
  to: Date;
  checkConfigs: Array<{ frequency: number; date: Date }>;
}

export function useTimepointsInRange({ from, to, checkConfigs }: UseTimepointsInRangeProps) {
  const rangeFrom = from.valueOf();
  const rangeTo = to.valueOf();

  // work backwards
  let configs = [...checkConfigs];

  // start with the latest config
  let currentConfig = configs.pop();

  // mutate for efficiency
  let build: Date[] = [];

  if (!currentConfig) {
    return build;
  }

  // remove non-full frequency timepoints
  let currentTimepoint = rangeTo - (rangeTo % currentConfig.frequency);

  while (currentTimepoint > rangeFrom && currentConfig) {
    const currentFrequency = currentConfig.frequency;
    const uptoDate = currentTimepoint - (currentTimepoint % currentFrequency);

    for (let i = uptoDate; i <= currentTimepoint; i += currentFrequency) {
      build.push(new Date(i));
    }

    currentTimepoint = uptoDate - currentFrequency;

    if (currentTimepoint.valueOf() < currentConfig.date.valueOf()) {
      currentConfig = configs.pop();
    }
  }

  console.log({ build, checkConfigs });
  return build;
}
