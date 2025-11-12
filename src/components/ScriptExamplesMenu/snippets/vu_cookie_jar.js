import http from 'k6/http'
import { expect } from 'https://jslib.k6.io/k6-testing/0.5.0/index.js'

export const options = {}

export default function () {
  // Get VU cookie jar and add a cookie to it providing the parameters
  // that a request must match (domain, path, HTTPS or not etc.)
  // to have the cookie attached to it when sent to the server.
  const jar = http.cookieJar()
  jar.set('https://quickpizza.grafana.com/api/cookies', 'my_cookie', 'hello world', {
    domain: 'quickpizza.grafana.com',
    path: '/api/cookies',
    secure: true,
    max_age: 600,
  })

  // As the following request is matching the above cookie in terms of domain,
  // path, HTTPS (secure) and will happen within the specified "age" limit, the
  // cookie will be attached to this request.
  const res = http.get('https://quickpizza.grafana.com/api/cookies')
  expect(res.status).toBe(200)
  expect(res.json().cookies.my_cookie).not.toBeNull()
  expect(res.json().cookies.my_cookie).toBe('hello world')
}
