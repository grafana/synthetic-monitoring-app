import http from 'k6/http';
import { expect } from 'https://jslib.k6.io/k6-testing/0.5.0/index.js';
import { sleep } from 'k6';

// Example SOAP request to convert numbers to words
const soapReqBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <NumberToWords xmlns="http://www.dataaccess.com/webservicesserver/">
      <ubiNum>42</ubiNum>
    </NumberToWords>
  </soap:Body>
</soap:Envelope>`;

export const options = {};

export default function () {
  // When making a SOAP POST request we must not forget to set the content type to text/xml
  let res = http.post('https://www.dataaccess.com/webservicesserver/NumberConversion.wso', soapReqBody, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: '',
    },
  });

  // Make sure the response is correct
  expect(res.status).toBe(200);
  expect(res.body).toContain('forty two');

  sleep(1);
}
