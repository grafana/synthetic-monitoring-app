import http from 'k6/http'
import { sleep } from 'k6'

export const options = {}

export default function () {
  // Request the page containing a form and save the response. This gives you access
  // to the response object, `res`.
  const res = http.get('https://test.k6.io/my_messages.php', {
    responseType: 'text',
  })

  // Query the HTML for an input field named "redir". We want the value or "redir"
  const elem = res.html().find('input[name=redir]')

  // Get the value of the attribute "value" and save it to a variable
  const val = elem.attr('value')

  // Now you can concatenate this extracted value in subsequent requests that require it.
  // ...
  // console.log() works when executing k6 scripts locally and is handy for debugging purposes
  console.log('The value of the hidden field redir is: ' + val)

  sleep(1)
}
