import http from 'k6/http'
import { sleep } from 'k6'

export const options = {}

export default function () {
  // Request the page containing a form and save the response. This gives you access
  // to the response object, `res`.
  const res = http.get('https://quickpizza.grafana.com/admin', {
    responseType: 'text',
  })

  // Query the HTML for an input field named "username". We want the id attribute
  const elem = res.html().find('input[name=username]')

  // Get the value of the attribute "id" and save it to a variable
  const val = elem.attr('id')

  // Now you can concatenate this extracted value in subsequent requests that require it.
  // ...
  // console.log() works when executing k6 scripts locally and is handy for debugging purposes
  console.log('The value of the username input id is: ' + val)

  sleep(1)
}
