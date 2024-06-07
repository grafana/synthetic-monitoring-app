import { Field } from '@grafana/data';

export enum RESULTS_BY_TARGET_TABLE_REF_ID {
  SUCCESS_RATE = 'successRate',
  EXPECTED_RESPONSE = 'expectedResponse',
  LATENCY = 'latency',
}

export function getValueFieldName(refId: RESULTS_BY_TARGET_TABLE_REF_ID) {
  return `Value #${refId}`;
}

// name is the name of the target. By default it is a url, but the end user can override that with a name specified in the k6 script.
// method is the HTTP method (e.g. GET, POST, etc.)
// Field name is the name of the field in the query (e.g. 'name' or 'Value #refId')
export function findValueByName(
  name: string,
  method: string,
  fieldName: string,
  fields: Array<Field<any>>
): any {
  const nameFieldIndex = fields.findIndex((field) => field.name === 'name' || field.name === 'url');
  if (nameFieldIndex === -1) {
    return;
  }
  const methodFieldIndex = fields.findIndex((field) => field.name === 'method');
  if (methodFieldIndex === -1) {
    return;
  }
  const index = fields[nameFieldIndex]?.values?.findIndex((value, index) => {
    return value === name && fields[methodFieldIndex]?.values?.[index] === method;
  });
  if (index === -1) {
    return;
  }
  const valueField = fields.findIndex((field) => field.name === fieldName);
  if (valueField === -1) {
    return;
  }
  return fields?.[valueField]?.values?.[index] ?? NaN;
}
