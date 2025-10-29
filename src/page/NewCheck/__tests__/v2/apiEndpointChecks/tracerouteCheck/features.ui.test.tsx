import { CheckType } from 'types';
import { getAdhocCheckTestButton } from 'components/Checkster/feature/adhoc-check/__testHelpers__/adhocCheck';

import { renderNewFormV2 } from '../../../../../__testHelpers__/checkForm';

describe('Traceroute Check - Features', () => {
  it('should not have a adhoc check button', async () => {
    await renderNewFormV2(CheckType.Traceroute);
    const testButton = getAdhocCheckTestButton();
    expect(testButton).not.toBeInTheDocument();
  });
});
