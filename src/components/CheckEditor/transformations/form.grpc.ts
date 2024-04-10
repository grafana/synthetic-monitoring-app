import { CheckFormValuesGRPC, CheckType, GRPCCheck, GRPCSettingsFormValues } from 'types';
import { getBaseFormValuesFromCheck } from 'components/CheckEditor/transformations/form.utils';

export function getGRPCCheckFormValues(check: GRPCCheck): CheckFormValuesGRPC {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.GRPC,
    settings: {
      grpc: getGRPCSettingsFormValues(check.settings),
    },
  };
}

const getGRPCSettingsFormValues = (settings: GRPCCheck['settings']): GRPCSettingsFormValues => {
  return {};
};
