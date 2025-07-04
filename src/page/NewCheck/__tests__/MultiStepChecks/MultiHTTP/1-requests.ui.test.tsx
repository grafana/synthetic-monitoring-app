import { screen, within } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';

import { CheckType } from 'types';
import { goToSectionV2, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { FormStepOrder } from '../../../../../components/CheckForm/constants';

const checkType = CheckType.MULTI_HTTP;

describe(`MultiHTTPCheck - Section 1 (Requests) UI`, () => {
  it(`can delete requests`, async () => {
    const { user } = await renderNewForm(checkType);
    await user.click(screen.getByText(`Add request`));

    const request = screen.getByTestId(`${DataTestIds.MULTI_HTTP_REQUEST}-1`);
    await user.click(within(request).getByLabelText('Remove request', { exact: false }));
    expect(request).not.toBeInTheDocument();
  });

  it(`will navigate to section 1 and open all requests with an error`, async () => {
    const { user } = await renderNewForm(checkType);
    await user.click(screen.getByText(`Add request`));
    await user.click(screen.getByText(`Add request`));
    await user.click(screen.getByText(`Add request`));

    await goToSectionV2(user, FormStepOrder.Uptime);
    await submitForm(user);

    const errors = screen.getAllByText(`Target must be a valid web URL`);

    // original target + 3 added
    expect(errors.length).toBe(4);
  });

  it(`will open all requests with errors, open the requests accordion and navigate to the first tab with an error`, async () => {
    const { user } = await renderNewForm(checkType);

    // add empty header object to first request
    const request1preSubmit = screen.getByTestId(`${DataTestIds.MULTI_HTTP_REQUEST}-0`);
    const request1Options = within(request1preSubmit).getByText(`Request options`);
    await user.click(request1Options);
    await user.click(within(request1preSubmit).getByText(`Add request header`, { exact: false }));

    // add valid request
    await user.click(screen.getByText(`Add request`));
    const request2preSubmit = screen.getByTestId(`${DataTestIds.MULTI_HTTP_REQUEST}-1`);
    const target = within(request2preSubmit).getByLabelText(`Request target for request 2 *`);
    await user.type(target, `https://grafana.com`);

    // add empty query params to third request
    await user.click(screen.getByText(`Add request`));
    const request3preSubmit = screen.getByTestId(`${DataTestIds.MULTI_HTTP_REQUEST}-2`);
    const request3Options = within(request3preSubmit).getByText(`Request options`);
    await user.click(request3Options);
    await user.click(within(request3preSubmit).getByText(`Query Parameters`));
    await user.click(within(request3preSubmit).getByText(`Add query parameter`, { exact: false }));

    // navigate to the second section
    await goToSectionV2(user, FormStepOrder.Uptime);
    await submitForm(user);

    const request1postSubmit = screen.getByTestId(`${DataTestIds.MULTI_HTTP_REQUEST}-0`);
    const request1NestedErr = await within(request1postSubmit).findByText(`Request header name is required`);
    expect(request1NestedErr).toBeInTheDocument();

    const request2postSubmit = screen.getByTestId(`${DataTestIds.MULTI_HTTP_REQUEST}-1`);
    const button = within(request2postSubmit).getByRole(`button`);
    expect(button).toHaveAttribute(`aria-expanded`, `false`);

    const request3postSubmit = screen.getByTestId(`${DataTestIds.MULTI_HTTP_REQUEST}-2`);
    const request3NestedErr = await within(request3postSubmit).findByText(`Query parameter name is required`);
    expect(request3NestedErr).toBeInTheDocument();
  });

  it(`will open all requests and open the variables accordion when it has errors`, async () => {
    const { user } = await renderNewForm(checkType);
    const request1preSubmit = screen.getByTestId(`${DataTestIds.MULTI_HTTP_REQUEST}-0`);
    await user.click(within(request1preSubmit).getByText(`Set variables`));
    await user.click(within(request1preSubmit).getByText(`Add variable`, { exact: false }));

    // add second request
    await user.click(screen.getByText(`Add request`));
    const request2preSubmit = screen.getByTestId(`${DataTestIds.MULTI_HTTP_REQUEST}-1`);
    await user.click(within(request2preSubmit).getByText(`Set variables`));
    await user.click(within(request2preSubmit).getByText(`Add variable`, { exact: false }));

    // navigate to the second section
    await goToSectionV2(user, FormStepOrder.Uptime);
    await submitForm(user);

    const request1postSubmit = screen.getByTestId(`${DataTestIds.MULTI_HTTP_REQUEST}-0`);
    const request1Err = await within(request1postSubmit).findByText(`Name is required`);
    expect(request1Err).toBeInTheDocument();

    const request2postSubmit = screen.getByTestId(`${DataTestIds.MULTI_HTTP_REQUEST}-1`);
    expect(within(request2postSubmit).getByText(`Name is required`)).toBeInTheDocument();
  });
});
