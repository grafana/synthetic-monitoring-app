import { screen, within } from '@testing-library/react';

import { CheckType, HttpMethod, MultiHttpVariableType } from 'types';
import { toBase64 } from 'utils';
import { selectComboboxOption, submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/v2.utils';

const checkType = CheckType.MULTI_HTTP;

describe(`MultiHTTPCheck - Section 1 (Request) payload`, () => {
  describe(`Single request`, () => {
    it(`has the correct default values submitted`, async () => {
      const { read, user } = await renderNewFormV2(checkType);
      await fillMandatoryFields({ user, checkType });
      await submitForm(user);
      const { body } = await read();

      expect(body.settings.multihttp.entries[0].request.method).toBe(HttpMethod.GET);
    });

    it(`can add entry request target`, async () => {
      const REQUEST_TARGET = `https://example.com`;

      const { read, user } = await renderNewFormV2(checkType);
      const entry = screen.getByLabelText(`Request entry 1`);
      expect(entry).toBeInTheDocument();

      const targetInput = within(entry).getByLabelText(/Request target \*/);

      await user.type(targetInput, REQUEST_TARGET);

      await fillMandatoryFields({ user, fieldsToOmit: [`target`], checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.multihttp.entries[0].request.url).toBe(REQUEST_TARGET);
    });

    describe(`Request options`, () => {
      it(`can submit request headers`, async () => {
        const HEADER_KEY_1 = `header-key-1`;
        const HEADER_VALUE_1 = `header-value-1`;
        const HEADER_KEY_2 = `header-key-2`;
        const HEADER_VALUE_2 = `header-value-2`;

        const { read, user } = await renderNewFormV2(checkType);

        await user.click(screen.getByText('Request options'));
        const addRequestHeaderButton = screen.getByRole('button', { name: /Header/ });
        await user.click(addRequestHeaderButton);

        const headerKeyInput = await screen.findByLabelText('Request headers 1 name');
        const headerValueInput = await screen.findByLabelText('Request headers 1 value');

        await user.type(headerKeyInput, HEADER_KEY_1);
        await user.type(headerValueInput, HEADER_VALUE_1);
        await user.click(addRequestHeaderButton);

        const headerKeyInput2 = await screen.findByLabelText('Request headers 2 name');
        const headerValueInput2 = await screen.findByLabelText('Request headers 2 value');

        await user.type(headerKeyInput2, HEADER_KEY_2);
        await user.type(headerValueInput2, HEADER_VALUE_2);

        await fillMandatoryFields({ user, checkType });
        await submitForm(user);

        const { body } = await read();

        expect(body.settings.multihttp.entries[0].request.headers).toEqual([
          { name: HEADER_KEY_1, value: HEADER_VALUE_1 },
          { name: HEADER_KEY_2, value: HEADER_VALUE_2 },
        ]);
      });

      it(`can submit query parameters`, async () => {
        const QUERYPARAM_KEY_1 = `query-key-1`;
        const QUERYPARAM_VALUE_1 = `query-value-1`;
        const QUERYPARAM_KEY_2 = `query-key-2`;
        const QUERYPARAM_VALUE_2 = `query-value-2`;

        const { read, user } = await renderNewFormV2(checkType);

        await user.click(screen.getByText('Request options'));
        await user.click(screen.getByText('Query parameters'));
        const addQueryParamButton = screen.getByRole('button', { name: /Query parameter/ });
        await user.click(addQueryParamButton);

        const headerKeyInput = await screen.findByLabelText('Query parameters 1 name');
        const headerValueInput = await screen.findByLabelText('Query parameters 1 value');

        await user.type(headerKeyInput, QUERYPARAM_KEY_1);
        await user.type(headerValueInput, QUERYPARAM_VALUE_1);
        await user.click(addQueryParamButton);

        const queryParamKeyInput2 = await screen.findByLabelText('Query parameters 2 name');
        const queryParamValueInput2 = await screen.findByLabelText('Query parameters 2 value');

        await user.type(queryParamKeyInput2, QUERYPARAM_KEY_2);
        await user.type(queryParamValueInput2, QUERYPARAM_VALUE_2);

        await fillMandatoryFields({ user, checkType });
        await submitForm(user);

        const { body } = await read();

        expect(body.settings.multihttp.entries[0].request.queryFields).toEqual([
          { name: QUERYPARAM_KEY_1, value: QUERYPARAM_VALUE_1 },
          { name: QUERYPARAM_KEY_2, value: QUERYPARAM_VALUE_2 },
        ]);
      });
    });

    describe(`Request body`, () => {
      it(`can submit the content type`, async () => {
        const CONTENT_TYPE = 'application/json';

        const { read, user } = await renderNewFormV2(checkType);
        await user.click(screen.getByText('Request options'));
        await user.click(screen.getByText('Body'));
        await user.type(screen.getByLabelText('Content type', { exact: false }), CONTENT_TYPE);

        await fillMandatoryFields({ user, checkType });
        await submitForm(user);

        const { body } = await read();

        expect(body.settings.multihttp.entries[0].request.body.contentType).toBe(CONTENT_TYPE);
      });

      it(`can submit the content encoding`, async () => {
        const CONTENT_ENCODING = 'gzip';

        const { read, user } = await renderNewFormV2(checkType);
        await user.click(screen.getByText('Request options'));
        await user.click(screen.getByText('Body'));
        await user.type(screen.getByLabelText('Content encoding', { exact: false }), CONTENT_ENCODING);

        await fillMandatoryFields({ user, checkType });
        await submitForm(user);

        const { body } = await read();

        expect(body.settings.multihttp.entries[0].request.body.contentEncoding).toBe(CONTENT_ENCODING);
      });

      it(`can submit the request body`, async () => {
        const REQUEST_BODY = 'some request body';

        const { read, user } = await renderNewFormV2(checkType);
        await user.click(screen.getByText('Request options'));
        await user.click(screen.getByText('Body'));
        await user.type(screen.getByLabelText('Request Body', { selector: `textarea`, exact: false }), REQUEST_BODY);

        await fillMandatoryFields({ user, checkType });
        await submitForm(user);

        const { body } = await read();

        expect(body.settings.multihttp.entries[0].request.body.payload).toBe(toBase64(REQUEST_BODY));
      });
    });

    describe(`Set variables`, () => {
      it(`can set a JSON path variable`, async () => {
        const VAR_NAME = 'a lovely variable';
        const VAR_EXPRESSION = '$.json.path';

        const { read, user } = await renderNewFormV2(checkType);

        await user.click(screen.getByText('Variables'));
        await user.click(screen.getByRole('button', { name: 'Variable' }));

        const variableNameInput = screen.getByLabelText('Variable name', { exact: false });
        await user.type(variableNameInput, VAR_NAME);

        await selectComboboxOption(user, screen.getByLabelText('Type'), /JSON Path/);

        const variableExpressionInput = screen.getByLabelText('JSON Path expression', { exact: false });
        await user.type(variableExpressionInput, VAR_EXPRESSION);

        await fillMandatoryFields({ user, checkType });
        await submitForm(user);

        const { body } = await read();

        expect(body.settings.multihttp.entries[0].variables).toEqual([
          {
            name: VAR_NAME,
            type: MultiHttpVariableType.JSON_PATH,
            expression: VAR_EXPRESSION,
          },
        ]);
      });

      it(`can set a Regular Expression variable`, async () => {
        const VAR_NAME = 'a lovely variable';
        const VAR_EXPRESSION = 'some regex';

        const { read, user } = await renderNewFormV2(checkType);

        await user.click(screen.getByText('Variables'));
        await user.click(screen.getByRole('button', { name: 'Variable' }));

        const variableNameInput = screen.getByLabelText('Variable name', { exact: false });
        await user.type(variableNameInput, VAR_NAME);

        await selectComboboxOption(user, screen.getByLabelText('Type'), /Regular Expression/);

        const variableExpressionInput = screen.getByLabelText('Regular Expression', { exact: false });
        await user.type(variableExpressionInput, VAR_EXPRESSION);

        await fillMandatoryFields({ user, checkType });
        await submitForm(user);

        const { body } = await read();

        expect(body.settings.multihttp.entries[0].variables).toEqual([
          {
            name: VAR_NAME,
            type: MultiHttpVariableType.REGEX,
            expression: VAR_EXPRESSION,
          },
        ]);
      });

      it(`can set a CSS selector variable`, async () => {
        const VAR_NAME = 'a lovely variable';
        const VAR_ATTRIBUTE = 'some attribute';
        const VAR_EXPRESSION = 'some regex';

        const { read, user } = await renderNewFormV2(checkType);

        await user.click(screen.getByText('Variables'));
        await user.click(screen.getByRole('button', { name: 'Variable' }));

        const variableNameInput = screen.getByLabelText('Variable name', { exact: false });
        await user.type(variableNameInput, VAR_NAME);

        await selectComboboxOption(user, screen.getByLabelText('Type'), /CSS Selector/);

        const variableAttributeInput = screen.getByLabelText('HTML attribute name', { exact: false });
        await user.type(variableAttributeInput, VAR_ATTRIBUTE);

        const variableExpressionInput = screen.getByLabelText('Selector', { exact: false });
        await user.type(variableExpressionInput, VAR_EXPRESSION);

        await fillMandatoryFields({ user, checkType });
        await submitForm(user);

        const { body } = await read();

        expect(body.settings.multihttp.entries[0].variables).toEqual([
          {
            name: VAR_NAME,
            type: MultiHttpVariableType.CSS_SELECTOR,
            expression: VAR_EXPRESSION,
            attribute: VAR_ATTRIBUTE,
          },
        ]);
      });
    });
  });
});
