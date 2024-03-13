import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 10,
  duration: '5m',
}

const username = 'user'
const password = 'passwd'

export default function () {
  // Passing username and password as part of URL plus the auth option will authenticate using HTTP Digest authentication
  let res = http.get(
    `http://${username}:${password}@httpbin.org/digest-auth/auth/${username}/${password}`,
    {
      auth: 'digest',
    }
  )

  // Verify response (checking the echoed data from the httpbin.org digest auth test API endpoint)
  check(res, {
    'status is 200': (r) => r.status === 200,
    'is authenticated': (r) => r.json().authenticated === true,
    'is correct user': (r) => r.json().user === username,
  })
  sleep(1)
}
