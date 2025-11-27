import { screen, within } from '@testing-library/react';

import { CheckType } from 'types';
import { gotoSection, submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { FormSectionName } from 'components/Checkster/types';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';

const checkType = CheckType.MULTI_HTTP;

// Exactly the same as "MultiHTTPCheck - Section 2 (Define uptime) UI"
describe(`MultiHTTPCheck - Section 1 (Requests) UI`, () => {
  it(`can delete requests`, async () => {
    const { user } = await renderNewFormV2(checkType);
    await user.click(screen.getByRole('button', { name: 'Request' }));

    const request = screen.getByLabelText('Request entry 2');
    expect(request).toBeInTheDocument();
    await user.click(within(request).getByLabelText('Delete request', { exact: false }));
    expect(request).not.toBeInTheDocument();
  });

  it(`will navigate to section 1 and open all requests with an error`, async () => {
    const { user } = await renderNewFormV2(checkType);
    await user.click(screen.getByRole('button', { name: 'Request' }));
    await user.click(screen.getByRole('button', { name: 'Request' }));
    await user.click(screen.getByRole('button', { name: 'Request' }));

    await gotoSection(user, FormSectionName.Uptime);
    await submitForm(user);

    const errors = screen.getAllByText(`Target must be a valid web URL`);

    // original target + 3 added
    expect(errors.length).toBe(4);
  });

  it(`will open all requests with errors, open the requests accordion and navigate to the first tab with an error`, async () => {
    const { user } = await renderNewFormV2(checkType);

    // add empty header object to first request
    const entry1 = screen.getByLabelText(`Request entry 1`);
    await user.click(within(entry1).getByText('Request options'));
    await user.click(within(entry1).getByRole('button', { name: 'Header' }));

    const addRequestButton = screen.getByRole('button', { name: 'Request' });

    // add valid request
    await user.click(addRequestButton);
    const entry2 = screen.getByLabelText(`Request entry 2`);
    await user.type(within(entry2).getByLabelText(/Request target \*/), `https://grafana.com`);

    // add empty query params to third request
    await user.click(addRequestButton);
    const entry3 = screen.getByLabelText(`Request entry 3`);
    await user.click(within(entry3).getByText('Request options'));
    await user.click(within(entry3).getByText(`Query parameters`));
    await user.click(within(entry3).getByRole('button', { name: `Query parameter` }));

    // navigate to the second section
    await gotoSection(user, FormSectionName.Uptime);
    await submitForm(user);

    const request1postSubmit = screen.getByLabelText(`Request entry 1`);
    const request1NestedErr = await within(request1postSubmit).findByText(`Header name is required`);
    expect(request1NestedErr).toBeInTheDocument();

    const request2postSubmit = screen.getByLabelText(`Request entry 2`);
    const button = within(request2postSubmit).getByRole('button', { name: /Request options/ });
    expect(button).toHaveAttribute(`aria-expanded`, `false`);

    const request3postSubmit = screen.getByLabelText(`Request entry 3`);
    const request3NestedErr = await within(request3postSubmit).findByText(`Query parameter name is required`);
    expect(request3NestedErr).toBeInTheDocument();
  });

  it(`will open all requests and open the variables accordion when it has errors`, async () => {
    const { user } = await renderNewFormV2(checkType);
    const request1preSubmit = screen.getByLabelText(`Request entry 1`);
    await user.click(within(request1preSubmit).getByText(`Variables`));
    await user.click(within(request1preSubmit).getByRole('button', { name: 'Variable' }));

    // add second request
    await user.click(screen.getByRole('button', { name: 'Request' }));
    const request2preSubmit = screen.getByLabelText(`Request entry 2`);
    await user.click(within(request2preSubmit).getByText(`Variables`));
    await user.click(within(request2preSubmit).getByRole('button', { name: 'Variable' }));

    // navigate to the second section
    await gotoSection(user, FormSectionName.Uptime);
    await submitForm(user);

    const request1postSubmit = screen.getByLabelText(`Request entry 1`);
    const request1Err = await within(request1postSubmit).findByText(`Name is required`);
    expect(request1Err).toBeInTheDocument();

    const request2postSubmit = screen.getByLabelText(`Request entry 2`);
    const request2Err = await within(request2postSubmit).findByText(`Name is required`);
    expect(request2Err).toBeInTheDocument();
  });
});
