import http from 'k6/http'
import { expect } from 'https://jslib.k6.io/k6-testing/0.5.0/index.js'

export const options = {}

export default function () {
  let res = http.get('https://quickpizza.grafana.com')
  expect(res.status).toBe(200)
  expect(res.proto).toBe('HTTP/2.0')
}
