import http from 'k6/http'
import { sleep } from 'k6'

export const options = {}

export default function () {
  // Request the page containing a form and save the response. This gives you access
  // to the response object, `res`.
  const res = http.get('https://quickpizza.grafana.com/login', {
    responseType: 'text',
  })

  // Query the HTML for a hidden input field. We want the value attribute
  const elem = res.html().find('input[type=hidden]')

  // Get the value of the attribute "value" and save it to a variable
  const val = elem.attr('value')

  // Now you can concatenate this extracted value in subsequent requests that require it.
  // ...
  // console.log() works when executing k6 scripts and is handy for debugging purposes
  console.log('The value of the hidden field is: ' + val)
}
