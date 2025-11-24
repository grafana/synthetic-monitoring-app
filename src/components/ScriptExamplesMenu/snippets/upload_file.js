import { expect } from 'https://jslib.k6.io/k6-testing/0.5.0/index.js'
import http from 'k6/http'

export const options = {}

// For demo purpose, we'll generate a random binary file,
// but you can also use a file from your local system:
// const binFile = open('/path/to/file.bin', 'b');
const binFile = new Uint8Array(4096).buffer

export default function () {
  const data = {
    field: 'this is a standard form field',
    file: http.file(binFile, 'test.bin', 'application/octet-stream'),
  }

  const res = http.post('https://quickpizza.grafana.com/api/post', data)
  expect(res.status).toBe(200)
}
