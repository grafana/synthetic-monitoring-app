import { MultiHttpAssertionType, MultiHttpVariableType } from 'types';
import {
  Assertion,
  AssertionConditionVariant,
  AssertionJsonPath,
  AssertionJsonPathValue,
  AssertionRegex,
  AssertionSubjectVariant,
  AssertionText,
  MultiHttpVariable,
} from 'components/MultiHttp/MultiHttpTypes';

import {
  TFMultiHttpAssertion,
  TFMultiHTTPAssertionCondition,
  TFMultiHttpAssertionSubject,
  TFMultiHTTPAssertionType,
  TFMultiHttpVariable,
  TFMultiHTTPVariableType,
} from './terraformTypes';

export const mapTFMultiHTTPAssertionCondition = (
  condition: AssertionConditionVariant
): TFMultiHTTPAssertionCondition => {
  switch (condition) {
    case AssertionConditionVariant.Contains:
      return 'CONTAINS';
    case AssertionConditionVariant.NotContains:
      return 'NOT_CONTAINS';
    case AssertionConditionVariant.Equals:
      return 'EQUALS';
    case AssertionConditionVariant.StartsWith:
      return 'STARTS_WITH';
    case AssertionConditionVariant.EndsWith:
      return 'ENDS_WITH';
    case AssertionConditionVariant.TypeOf:
      return 'TYPE_OF';
    default:
      throw new Error(`Unknown condition: ${condition}`);
  }
};

export const mapTFMultiHTTPAssertionSubject = (subject: AssertionSubjectVariant): TFMultiHttpAssertionSubject => {
  switch (subject) {
    case AssertionSubjectVariant.ResponseBody:
      return 'RESPONSE_BODY';
    case AssertionSubjectVariant.ResponseHeaders:
      return 'RESPONSE_HEADERS';
    case AssertionSubjectVariant.HttpStatusCode:
      return 'HTTP_STATUS_CODE';
    default:
      throw new Error(`Unknown subject: ${subject}`);
  }
};

export function mapAssertionsToTF(entryCheck: Assertion): TFMultiHttpAssertion {
  let assertionType: TFMultiHTTPAssertionType;

  switch (entryCheck.type) {
    case MultiHttpAssertionType.Text:
      assertionType = 'TEXT';
      break;
    case MultiHttpAssertionType.JSONPathValue:
      assertionType = 'JSON_PATH_VALUE';
      break;
    case MultiHttpAssertionType.JSONPath:
      assertionType = 'JSON_PATH_ASSERTION';
      break;
    case MultiHttpAssertionType.Regex:
      assertionType = 'REGEX_ASSERTION';
      break;
    default:
      assertionType = 'TEXT';
  }

  const assertion: TFMultiHttpAssertion = {
    type: assertionType,
  };

  switch (assertionType) {
    case 'TEXT': {
      const entryCheckText = entryCheck as AssertionText;

      // For TEXT assertions, we expect `condition`, `subject`, and `value`
      if (entryCheckText.condition && entryCheckText.subject && entryCheckText.value) {
        assertion.condition = mapTFMultiHTTPAssertionCondition(entryCheckText.condition);
        assertion.subject = mapTFMultiHTTPAssertionSubject(entryCheckText.subject);
        assertion.value = entryCheckText.value;
      }
      break;
    }

    case 'JSON_PATH_VALUE': {
      const entryCheckJsonPathValue = entryCheck as AssertionJsonPathValue;

      // For JSON_PATH_VALUE, we expect `condition`, `expression`, and `value`
      if (entryCheckJsonPathValue.condition && entryCheckJsonPathValue.expression && entryCheckJsonPathValue.value) {
        assertion.condition = mapTFMultiHTTPAssertionCondition(entryCheckJsonPathValue.condition);
        assertion.expression = entryCheckJsonPathValue.expression;
        assertion.value = entryCheckJsonPathValue.value;
      }
      break;
    }

    case 'JSON_PATH_ASSERTION': {
      const entryCheckJsonPath = entryCheck as AssertionJsonPath;

      // For JSON_PATH_ASSERTION, we only need the `expression`
      if (entryCheckJsonPath.expression) {
        assertion.expression = entryCheckJsonPath.expression;
      }
      break;
    }

    case 'REGEX_ASSERTION': {
      const entryCheckRegex = entryCheck as AssertionRegex;

      // For REGEX_ASSERTION, we expect `subject`, and `expression`
      if (entryCheckRegex.subject && entryCheckRegex.expression) {
        assertion.subject = mapTFMultiHTTPAssertionSubject(entryCheckRegex.subject);
        assertion.expression = entryCheckRegex.expression;
      }
      break;
    }

    default:
      break;
  }

  return assertion;
}

export function mapVariablesToTF(variable: MultiHttpVariable): TFMultiHttpVariable {
  let variableType: TFMultiHTTPVariableType;
  switch (variable.type) {
    case MultiHttpVariableType.CSS_SELECTOR:
      variableType = 'CSS_SELECTOR';
      break;
    case MultiHttpVariableType.JSON_PATH:
      variableType = 'JSON_PATH';
      break;
    case MultiHttpVariableType.REGEX:
      variableType = 'REGEX';
      break;

    default:
      variableType = 'JSON_PATH';
  }

  return {
    ...variable,
    type: variableType,
  };
}
