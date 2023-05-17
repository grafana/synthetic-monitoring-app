import { getRandomProbes } from 'utils';

it('gets random probes', async () => {
  const probes = [11, 23, 5, 5212, 43, 3, 4, 6];
  const random = getRandomProbes(probes, 4);
  expect(random.length).toBe(4);

  random.forEach((randomId) => {
    const found = probes.findIndex((probeId) => probeId === randomId);
    expect(found).toBeGreaterThan(-1);
  });

  const random2 = getRandomProbes(probes, 2);
  expect(random2.length).toBe(2);
});
