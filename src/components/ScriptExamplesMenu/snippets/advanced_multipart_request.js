import http from 'k6/http'
import { check } from 'k6'
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js'

// For demo purpose, we'll generate in-memory files,
// but you can also use files from your local system:
// const img1 = open('/path/to/image1.png', 'b')
// const img2 = open('/path/to/image2.jpg', 'b')
// const txt = open('/path/to/text.txt')
const img1 = new Uint8Array(4096).buffer
const img2 = new Uint8Array(4096).buffer
const txt = 'some text'

export const options = {}

export default function () {
  const fd = new FormData()
  fd.append('someTextField', 'someValue')
  fd.append('aBinaryFile', {
    data: new Uint8Array(img1).buffer,
    filename: 'logo.png',
    content_type: 'image/png',
  })
  fd.append('anotherTextField', 'anotherValue')
  fd.append('images', http.file(img1, 'image1.png', 'image/png'))
  fd.append('images', http.file(img2, 'image2.jpg', 'image/jpeg'))
  fd.append('text', http.file(txt, 'text.txt', 'text/plain'))

  const res = http.post('https://httpbin.test.k6.io/post', fd.body(), {
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
  })
  check(res, {
    'is status 200': (r) => r.status === 200,
  })
}
