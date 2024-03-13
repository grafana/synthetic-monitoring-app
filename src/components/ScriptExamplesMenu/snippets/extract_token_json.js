import http from 'k6/http'
import { check } from 'k6'

export const options = {}

export default function () {
  // Make a request that returns some JSON data
  const res = http.get('https://httpbin.test.k6.io/json')

  // Extract data from that JSON data by first parsing it
  // using a call to "json()" and then accessing properties by
  // navigating the JSON data as a JS object with dot notation.
  const slide1 = res.json().slideshow.slides[0]
  check(slide1, {
    'slide 1 has correct title': (s) => s.title === 'Wake up to WonderWidgets!',
    'slide 1 has correct type': (s) => s.type === 'all',
  })

  // Now we could use the "slide1" variable in subsequent requests...
}
