import { screen } from '@testing-library/react';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { mockFeatureToggles, probeToMetadataProbe } from 'test/utils';

import { CheckType, FeatureName } from 'types';
import { goToSectionV2, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { FormStepOrder } from '../../../../../components/CheckForm/constants';
import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.PING;

describe(`PingCheck - Section 4 (Alerting) payload`, () => {
  it(`has the correct default values`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSectionV2(user, FormStepOrder.Alerting);
    await submitForm(user);
    const { body } = await read();

    expect(body.alerts).toEqual(undefined);
  });

  it(`can add specific ping alerts`, async () => {
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
    });

    const { user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType, fieldsToOmit: ['probes'] });
    await goToSectionV2(user, FormStepOrder.Execution);
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
    await user.click(probeCheckbox);

    await goToSectionV2(user, FormStepOrder.Alerting);

    expect(screen.getByText('Per-check alerts')).toBeInTheDocument();

    expect(screen.queryByText(`Alert if the target's certificate expires in less than`)).not.toBeInTheDocument();
  });
});
