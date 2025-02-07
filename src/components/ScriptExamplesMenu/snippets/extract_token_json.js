import http from 'k6/http';
import { check } from 'k6';

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
  check(dough1, {
    'dough1 1 has correct name': (s) => s.name === 'Thin',
    'dough1 1 has correct ID': (s) => s.ID === 1,
  });

  // Now we could use the "dough1" variable in subsequent requests...
}
