import http from 'k6/http';
import { expect } from 'https://jslib.k6.io/k6-testing/0.5.0/index.js';

export default function () {
  // Make a request that returns some JSON data
  const reqHeaders = {
    Authorization: 'Token abcdef0123456789',
  };
  const res = http.get('https://quickpizza.grafana.com/api/doughs', {
    headers: reqHeaders,
  });

  // Extract data from that JSON data by first parsing it
  // using a call to "json()" and then accessing properties by
  // navigating the JSON data as a JS object with dot notation.
  const dough1 = res.json().doughs[0];
  expect(dough1.name).toBe('Thin');
  expect(dough1.ID).toBe(1);

  // Now we could use the "dough1" variable in subsequent requests...
}
