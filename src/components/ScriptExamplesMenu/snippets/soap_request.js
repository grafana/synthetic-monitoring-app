import http from 'k6/http'
import { expect } from 'https://jslib.k6.io/k6-testing/0.5.0/index.js'
import { sleep } from 'k6'

const soapReqBody = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:hs="http://www.holidaywebservice.com/HolidayService_v2/">
    <soapenv:Body>
        <hs:GetHolidaysAvailable>
            <hs:countryCode>UnitedStates</hs:countryCode>
        </hs:GetHolidaysAvailable>
    </soapenv:Body>
</soapenv:Envelope>`

export const options = {}

export default function () {
  // When making a SOAP POST request we must not forget to set the content type to text/xml
  let res = http.post(
    'http://www.holidaywebservice.com/HolidayService_v2/HolidayService2.asmx?wsdl',
    soapReqBody,
    {
      headers: { 'Content-Type': 'text/xml' },
    }
  )

  // Make sure the response is correct
  expect(res.status).toBe(200)
  expect(res.body).toContain('BLACK-FRIDAY')

  sleep(1)
}
