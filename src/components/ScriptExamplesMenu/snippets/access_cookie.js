import http from 'k6/http'
import { expect } from 'https://jslib.k6.io/k6-testing/0.5.0/index.js'

export const options = {}

export default function () {
  // Since this request redirects the `res.cookies` property won't contain the cookies
  const res = http.post(
    'https://quickpizza.grafana.com/api/cookies?name1=value1&name2=value2'
  )
  expect(res.status).toBe(200)

  // Make sure cookies have been added to VU cookie jar
  const vuJar = http.cookieJar()
  const cookiesForURL = vuJar.cookiesForURL(res.url)
  expect(cookiesForURL.name1.length).toBeGreaterThan(0)
  expect(cookiesForURL.name2.length).toBeGreaterThan(0)
}
