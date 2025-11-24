import encoding from 'k6/encoding'
import http from 'k6/http'
import { expect } from 'https://jslib.k6.io/k6-testing/0.5.0/index.js'

const username = 'user'
const password = 'passwd'

export const options = {}

export default function () {
  const credentials = `${username}:${password}`

  // Passing username and password as part of the URL will
  // allow us to authenticate using HTTP Basic Auth.
  const url = `https://${credentials}@quickpizza.grafana.com/api/basic-auth/${username}/${password}`

  let res = http.get(url)

  // Verify response
  expect(res.status).toBe(200)
  expect(res.json().authenticated).toBe(true)
  expect(res.json().user).toBe(username)

  // Alternatively you can create the header yourself to authenticate
  // using HTTP Basic Auth
  const encodedCredentials = encoding.b64encode(credentials)
  const options = {
    headers: {
      Authorization: `Basic ${encodedCredentials}`,
    },
  }

  res = http.get(
    `https://quickpizza.grafana.com/api/basic-auth/${username}/${password}`,
    options
  )

  // Verify response (checking the echoed data from the QuickPizza
  // basic auth test API endpoint)
  expect(res.status).toBe(200)
  expect(res.json().authenticated).toBe(true)
  expect(res.json().user).toBe(username)
}
