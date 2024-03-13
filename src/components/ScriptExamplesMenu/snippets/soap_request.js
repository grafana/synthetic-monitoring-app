import http from 'k6/http'
import { check, sleep } from 'k6'

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
  check(res, {
    'status is 200': (r) => r.status === 200,
    'black friday is present': (r) => r.body.indexOf('BLACK-FRIDAY') !== -1,
  })

  sleep(1)
}
