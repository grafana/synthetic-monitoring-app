import { CheckType } from 'types';

const CheckTimeoutValues = {
  [CheckType.PING]: { min: 1, max: 60 },
  [CheckType.TCP]: { min: 1, max: 60 },
  [CheckType.Traceroute]: { min: 30, max: 30 },
  [CheckType.DNS]: { min: 1, max: 60 },
  [CheckType.GRPC]: { min: 1, max: 60 },
  [CheckType.HTTP]: { min: 1, max: 60 },
  [CheckType.MULTI_HTTP]: { min: 5, max: 180 },
  [CheckType.Scripted]: { min: 5, max: 180 },
  [CheckType.Browser]: { min: 5, max: 180 },
};

export { CheckTimeoutValues };
