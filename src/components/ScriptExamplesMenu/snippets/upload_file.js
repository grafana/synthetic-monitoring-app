import { check } from 'k6'
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
  check(res, {
    'is status 200': (r) => r.status === 200,
  })
}
